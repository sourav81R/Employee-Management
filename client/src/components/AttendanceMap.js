// c:\Employee-Management\client\src\components\AttendanceMap.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS
import L from 'leaflet';

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function AttendanceMap({ latitude, longitude, popupText = "Attendance Location", zoom = 15 }) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return <p>Location data not available.</p>;
    }

    const position = [latitude, longitude];

    return (
        <div style={{ height: 'min(400px, 50vh)', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>{popupText}</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
