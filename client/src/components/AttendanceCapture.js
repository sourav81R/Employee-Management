// c:\Employee-Management\client\src\components\AttendanceCapture.js
import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext"; // Assuming AuthContext provides user info
import "../styles/AttendanceCapture.css"; // We'll create this CSS file

export default function AttendanceCapture() {
  const { user } = useContext(AuthContext);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoData, setPhotoData] = useState(null); // Base64 string of the photo
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [message, setMessage] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

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
    } catch (geoErr) {
      console.error("Reverse geocode error:", geoErr);
      return "";
    }
  };

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
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
        setMessage(place ? "Location captured with place name." : "Location captured.");
        setLocationLoading(false);
      },
      (geoError) => {
        console.error("Error getting location:", geoError);
        setError("Could not get your location. Please allow location access and try again.");
        setMessage(null);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Camera API is unavailable. Use image upload instead.");
      return;
    }

    setCameraLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraEnabled(true);
      setMessage("Camera ready. Take photo or upload one.");
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage("Camera is blocked or unavailable. Use image upload instead.");
      setCameraEnabled(false);
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setError("You must be logged in to mark attendance.");
      return undefined;
    }

    startCamera();
    getLocation();

    return () => {
      stopStream();
    };
  }, [user]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      // Set canvas dimensions to match video feed
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL("image/jpeg", 0.8); // Capture as JPEG with 80% quality
      setPhotoData(imageData);
      setMessage("Photo captured! Click 'Mark Attendance' to submit.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setPhotoData(reader.result);
        setMessage("Photo selected. Click 'Mark Attendance' to submit.");
      } else {
        setError("Failed to read selected image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitAttendance = async () => {
    if (!photoData || !location) {
      setError("Please ensure both photo and location are captured before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage("Submitting attendance...");

    try {
      await axios.post(
        `${API_BASE_URL}/api/attendance`,
        {
          employeeId: user._id, // Assuming user object has _id from AuthContext
          photo: photoData,
          latitude: location.latitude,
          longitude: location.longitude,
          locationName,
          deviceType: detectDeviceType(),
        },
        getAuthHeader()
      );
      setMessage("Attendance marked successfully!");
      clearPhoto();
      stopStream();
    } catch (err) {
      const resData = err.response?.data;
      const isHtml = typeof resData === "string" && resData.trim().startsWith("<");
      console.error("Error marking attendance:", isHtml ? "Server returned HTML (likely 404)" : (resData || err.message));
      setError("Failed to mark attendance. " + (isHtml ? "Server endpoint not found." : (resData?.message || "Please try again.")));
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
        {!photoData && ( // Only show video feed if no photo has been taken yet
          <video ref={videoRef} autoPlay playsInline muted className="camera-feed"></video>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas> {/* Hidden canvas for capturing */}
        {photoData && <img src={photoData} alt="Captured Attendance" className="photo-preview" />}
      </div>

      <div className="controls">
        <button onClick={takePhoto} disabled={!stream || loading || cameraLoading || !cameraEnabled} className="btn btn-primary">
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
              Location: Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
            </p>
            <p>Place: {locationName || "Resolving place name..."}</p>
          </>
        ) : (
          <p>Waiting for location...</p>
        )}
        <button type="button" className="btn btn-link" onClick={getLocation} disabled={locationLoading || loading}>
          {locationLoading ? "Refreshing location..." : "Refresh Location"}
        </button>
      </div>
    </div>
  );
}
