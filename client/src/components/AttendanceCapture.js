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
  const [message, setMessage] = useState("Enable camera and location before submitting.");

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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(nextLocation);
        const place = await resolveLocationName(nextLocation.latitude, nextLocation.longitude);
        setLocationName(place);
        setMessage(place ? "Location captured." : "Location captured (no place name found).");
        setLocationLoading(false);
      },
      (_geoError) => {
        setError("Could not get location. Allow location access, then try Refresh Location.");
        setMessage(null);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
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

  useEffect(() => {
    if (!user) {
      setError("You must be logged in to mark attendance.");
      return undefined;
    }

    getLocation();
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
    if (!photoData || !location) {
      setError("Please capture both photo and location before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage("Submitting attendance...");

    try {
      await axios.post(
        buildApiUrl("/api/attendance"),
        {
          photo: photoData,
          latitude: location.latitude,
          longitude: location.longitude,
          locationName,
          deviceType: detectDeviceType(),
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessage("Attendance marked successfully.");
      clearPhoto();
      stopStream();
    } catch (err) {
      const resData = err.response?.data;
      const isHtml = typeof resData === "string" && resData.trim().startsWith("<");
      setError(
        `Failed to mark attendance. ${
          isHtml ? "Server endpoint not found." : resData?.message || "Please try again."
        }`
      );
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-capture-container">
      <h2>Mark Your Attendance</h2>
      {error && <p className="error-message">{error}</p>}
      {message && !error && <p className="info-message">{message}</p>}

      <div className="camera-feed-wrapper">
        {!photoData && <video ref={videoRef} autoPlay playsInline muted className="camera-feed"></video>}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        {photoData && <img src={photoData} alt="Captured Attendance" className="photo-preview" />}
      </div>

      <div className="controls">
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
          {loading ? "Submitting..." : "Mark Attendance"}
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
    </div>
  );
}
