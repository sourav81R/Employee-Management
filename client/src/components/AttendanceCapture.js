import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiBase";
import "../styles/AttendanceCapture.css";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureOrLocalhost() {
  if (typeof window === "undefined") return true;
  return window.isSecureContext || LOCAL_HOSTS.has(window.location.hostname);
}

function getGeoErrorMessage(error) {
  if (!error) return "Could not get location. Please try again.";
  if (error.code === 1) return "Location permission denied. Enable location access in browser/site settings.";
  if (error.code === 2) return "Location unavailable. Turn on GPS/mobile location and try again.";
  if (error.code === 3) return "Location request timed out. Move to an open area and try Refresh Location.";
  return "Could not get location. Please try again.";
}

function requestPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function getLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not available";
  return date.toLocaleTimeString();
}

function formatWorkedMinutes(attendance) {
  if (!attendance?.checkOut) return "0h 0m";

  const rawMinutes = Number(attendance.workedMinutes);
  if (Number.isFinite(rawMinutes) && rawMinutes >= 0) {
    const hours = Math.floor(rawMinutes / 60);
    const minutes = rawMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  const checkIn = new Date(attendance.checkIn || attendance.timestamp);
  const checkOut = new Date(attendance.checkOut);
  if (!Number.isFinite(checkIn.getTime()) || !Number.isFinite(checkOut.getTime())) return "0h 0m";
  const diffMinutes = Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function AttendanceCapture() {
  const { user } = useContext(AuthContext);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [message, setMessage] = useState("Capture photo and location, then check in.");

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setCameraEnabled(false);
  };

  const detectDeviceType = () => {
    const ua = navigator.userAgent || "";
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)) return "mobile";
    if (navigator.maxTouchPoints > 0 && /Macintosh/i.test(ua)) return "tablet";
    return "desktop";
  };

  const resolveLocationName = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      if (!res.ok) return "";
      const data = await res.json();
      return (
        data.display_name ||
        data.name ||
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        ""
      );
    } catch (_geoErr) {
      return "";
    }
  };

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    if (!isSecureOrLocalhost()) {
      setError("Location requires HTTPS on mobile devices. Open this app over HTTPS.");
      return;
    }

    setLocationLoading(true);
    setMessage("Getting your location...");
    setError(null);

    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setError("Location permission is blocked. Enable it from browser settings, then refresh location.");
          setMessage(null);
          return;
        }
      }

      let position;
      try {
        // Try accurate GPS first.
        position = await requestPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      } catch (_firstErr) {
        // Fallback for slow/noisy mobile GPS: allow cached + non-high-accuracy.
        position = await requestPosition({ enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
      }

      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(nextLocation);
      const place = await resolveLocationName(nextLocation.latitude, nextLocation.longitude);
      setLocationName(place);
      setMessage(place ? "Location captured." : "Location captured (place name unavailable).");
    } catch (geoError) {
      setError(getGeoErrorMessage(geoError));
      setMessage(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera API is unavailable on this browser. Use Upload Photo.");
      return;
    }

    if (!isSecureOrLocalhost()) {
      setError("Camera requires HTTPS on mobile devices. Open this app over HTTPS.");
      return;
    }

    setCameraLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraEnabled(true);
      setMessage("Camera ready.");
    } catch (_err) {
      setCameraEnabled(false);
      setError("Could not access camera. Allow permission or use Upload Photo.");
    } finally {
      setCameraLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setTodayAttendance(null);
      return;
    }

    try {
      const res = await axios.get(buildApiUrl("/api/attendance/today"), {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: getLocalDateString() },
      });
      const record = res?.data;
      setTodayAttendance(record && record._id ? record : null);
    } catch (_err) {
      setTodayAttendance(null);
    }
  };

  useEffect(() => {
    if (!user) {
      setError("You must be logged in to mark attendance.");
      return undefined;
    }

    getLocation();
    fetchTodayAttendance();
    return () => stopStream();
  }, [user]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.videoWidth < 2 || videoRef.current.videoHeight < 2) {
      setError("Camera is not ready yet. Please wait and try again.");
      return;
    }

    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const imageData = canvasRef.current.toDataURL("image/jpeg", 0.8);
    setPhotoData(imageData);
    setMessage("Photo captured. Submit attendance when ready.");
    setError(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setPhotoData(reader.result);
        setMessage("Photo selected.");
        setError(null);
      } else {
        setError("Failed to read selected image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitAttendance = async () => {
    const checkInTime = todayAttendance?.checkIn || todayAttendance?.timestamp;
    if (checkInTime) {
      setError(`You are already checked in today at ${formatDateTime(checkInTime)}.`);
      return;
    }

    if (!photoData || !location) {
      setError("Please capture both photo and location before submitting.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      return;
    }

    setLoading(true);
    setActionType("checkin");
    setError(null);
    setMessage("Checking in...");

    try {
      const res = await axios.post(
        buildApiUrl("/api/attendance/check-in"),
        {
          date: getLocalDateString(),
          photo: photoData,
          latitude: location.latitude,
          longitude: location.longitude,
          locationName,
          deviceType: detectDeviceType(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const responseRecord = res?.data || {};
      const checkedInAt = responseRecord.checkIn || responseRecord.timestamp;
      setMessage(`Checked in successfully at ${formatDateTime(checkedInAt)}.`);
      clearPhoto();
      stopStream();
      await fetchTodayAttendance();
    } catch (err) {
      const resData = err.response?.data;
      const isHtml = typeof resData === "string" && resData.trim().startsWith("<");
      setError(
        `Failed to check in. ${
          isHtml ? "Server endpoint not found." : resData?.message || "Please try again."
        }`
      );
      setMessage(null);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleCheckOut = async () => {
    const checkInTime = todayAttendance?.checkIn || todayAttendance?.timestamp;
    if (!checkInTime) {
      setError("Please check in first.");
      return;
    }
    if (todayAttendance?.checkOut) {
      setError(`You already checked out at ${formatDateTime(todayAttendance.checkOut)}.`);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      return;
    }

    setLoading(true);
    setActionType("checkout");
    setError(null);
    setMessage("Checking out...");

    try {
      const res = await axios.post(
        buildApiUrl("/api/attendance/check-out"),
        { date: getLocalDateString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const responseRecord = res?.data || {};
      setMessage(
        responseRecord.workHoursMessage ||
          `Checked out successfully at ${formatDateTime(responseRecord.checkOut)}.`
      );
      await fetchTodayAttendance();
    } catch (err) {
      const resData = err.response?.data;
      const isHtml = typeof resData === "string" && resData.trim().startsWith("<");
      setError(
        `Failed to check out. ${
          isHtml ? "Server endpoint not found." : resData?.message || "Please try again."
        }`
      );
      setMessage(null);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const checkInTime = todayAttendance?.checkIn || todayAttendance?.timestamp;
  const checkOutTime = todayAttendance?.checkOut || null;
  const hasCheckedIn = Boolean(checkInTime);
  const hasCheckedOut = Boolean(checkOutTime);

  return (
    <div className="attendance-capture-container">
      <h2>Mark Your Attendance</h2>
      {error && <p className="error-message">{error}</p>}
      {message && !error && <p className="info-message">{message}</p>}

      <div className="today-attendance-panel">
        <p>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </p>
        <p>
          <strong>Check-In Time:</strong> {checkInTime ? formatDateTime(checkInTime) : "Not checked in yet"}
        </p>
        <p>
          <strong>Check-Out Time:</strong> {checkOutTime ? formatDateTime(checkOutTime) : "Not checked out yet"}
        </p>
        {hasCheckedOut && (
          <p>
            <strong>Total Worked:</strong> {formatWorkedMinutes(todayAttendance)}
          </p>
        )}
      </div>

      {!hasCheckedIn && (
        <>
          <div className="camera-feed-wrapper" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            {!photoData && (
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" style={{ maxWidth: "100%", borderRadius: "8px" }}></video>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            {photoData && (
              <img src={photoData} alt="Captured Attendance" className="photo-preview" style={{ maxWidth: "100%", borderRadius: "8px" }} />
            )}
          </div>

          <div className="controls" style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "15px" }}>
            <button
              type="button"
              onClick={startCamera}
              disabled={cameraLoading || loading || cameraEnabled}
              className="btn btn-secondary"
            >
              {cameraLoading ? "Enabling..." : cameraEnabled ? "Camera Enabled" : "Enable Camera"}
            </button>
            <button
              type="button"
              onClick={stopStream}
              disabled={!cameraEnabled || loading}
              className="btn btn-danger"
            >
              Disable Camera
            </button>
            <button
              type="button"
              onClick={takePhoto}
              disabled={!stream || loading || cameraLoading || !cameraEnabled}
              className="btn btn-primary"
            >
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn btn-secondary"
            >
              Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {photoData && (
              <button type="button" onClick={clearPhoto} disabled={loading} className="btn btn-danger">
                Retake
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmitAttendance}
              disabled={!photoData || !location || loading}
              className="btn btn-success"
            >
              {loading && actionType === "checkin" ? "Checking In..." : "Check In"}
            </button>
          </div>

          <div className="location-info">
            {location ? (
              <>
                <p>
                  Location: Latitude {location.latitude.toFixed(6)}, Longitude {location.longitude.toFixed(6)}
                </p>
                <p>Place: {locationName || "Resolving place name..."}</p>
              </>
            ) : (
              <p>Location not captured yet.</p>
            )}
            <button type="button" className="btn btn-link" onClick={getLocation} disabled={locationLoading || loading}>
              {locationLoading ? "Refreshing location..." : "Refresh Location"}
            </button>
          </div>
        </>
      )}

      {hasCheckedIn && !hasCheckedOut && (
        <div className="controls checkout-controls">
          <button type="button" onClick={handleCheckOut} disabled={loading} className="btn btn-warning">
            {loading && actionType === "checkout" ? "Checking Out..." : "Check Out"}
          </button>
        </div>
      )}

      {hasCheckedOut && (
        <p className="attendance-day-complete">Attendance completed for today.</p>
      )}
    </div>
  );
}
