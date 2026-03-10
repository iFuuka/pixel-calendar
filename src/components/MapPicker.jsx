import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.css';

/* ─── Custom pixel-art SVG pin marker ──────────────────────────── */
const PIXEL_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="image-rendering:pixelated">
  <!-- shadow -->
  <ellipse cx="14" cy="34" rx="5" ry="2" fill="rgba(74,56,96,0.25)"/>
  <!-- pin body -->
  <rect x="4"  y="2"  width="20" height="20" rx="2" fill="#f090a8"/>
  <rect x="6"  y="4"  width="16" height="16" rx="1" fill="#f8b8cc"/>
  <!-- shine -->
  <rect x="8"  y="6"  width="5"  height="4"  fill="#fce4ec" opacity="0.8"/>
  <!-- pixel detail -->
  <rect x="11" y="12" width="6"  height="2"  fill="#d0607a"/>
  <rect x="12" y="10" width="4"  height="2"  fill="#d0607a"/>
  <!-- needle -->
  <rect x="12" y="22" width="4"  height="10" fill="#d0607a"/>
  <rect x="13" y="30" width="2"  height="4"  fill="#b04060"/>
</svg>
`.trim();

const pixelIcon = L.divIcon({
    html: PIXEL_PIN_SVG,
    className: 'pixel-map-marker',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
});

/* ─── Inner component: handles map click events ─────────────────── */
function ClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

/* ─── Inner component: flies to new center when props change ──────── */
function MapFlyTo({ lat, lon }) {
    const map = useMap();
    const prevRef = useRef(null);
    useEffect(() => {
        const key = `${lat},${lon}`;
        if (prevRef.current !== key) {
            prevRef.current = key;
            map.flyTo([lat, lon], map.getZoom(), { duration: 0.8 });
        }
    }, [lat, lon, map]);
    return null;
}

/* ─── Reverse geocode: lat/lon → city name ──────────────────────── */
async function reverseGeocode(lat, lon) {
    // Open-Meteo geocoding doesn't support true lat/lon reverse lookup,
    // so we form a short search using the rounded coordinates area name
    // via Nominatim (no key needed, free OSM reverse geocoding)
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const addr = data.address || {};
        // Pick the most meaningful name: city > town > village > county > country
        const name =
            addr.city || addr.town || addr.village ||
            addr.municipality || addr.county || addr.state || addr.country;
        const country = addr.country_code ? addr.country_code.toUpperCase() : '';
        return name ? (country ? `${name}, ${country}` : name) : null;
    } catch {
        return null;
    }
}

/* ─── Main MapPicker component ──────────────────────────────────── */
export default function MapPicker({ lat, lon, locationName, onLocationChange }) {
    const [markerPos, setMarkerPos] = useState([lat, lon]);
    const [statusMsg, setStatusMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    // When external lat/lon changes (e.g., from city search), sync marker
    useEffect(() => {
        setMarkerPos([lat, lon]);
    }, [lat, lon]);

    const handleMapClick = useCallback(async (clickLat, clickLon) => {
        const roundedLat = Math.round(clickLat * 10000) / 10000;
        const roundedLon = Math.round(clickLon * 10000) / 10000;
        setMarkerPos([roundedLat, roundedLon]);
        setLoading(true);
        setStatusMsg('🔍 Finding location…');

        const name = await reverseGeocode(roundedLat, roundedLon);
        const locationLabel = name || `${roundedLat.toFixed(3)}°, ${roundedLon.toFixed(3)}°`;

        onLocationChange(roundedLat, roundedLon, locationLabel);
        setStatusMsg(`✅ ${locationLabel}`);
        setLoading(false);
    }, [onLocationChange]);

    return (
        <div className="map-picker-wrap">
            {/* Status bar */}
            <div className="map-status-bar">
                <span className="map-status-pin">📍</span>
                <span className={`map-status-text ${loading ? 'map-status--loading' : ''}`}>
                    {statusMsg || locationName}
                </span>
            </div>

            {/* Hint */}
            <p className="map-hint">Click anywhere on the map to set your weather location</p>

            {/* Map */}
            <div className="map-container-wrap pixel-border">
                <MapContainer
                    center={[lat, lon]}
                    zoom={5}
                    className="map-container"
                    zoomControl={true}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        className="map-tiles-filtered"
                        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                    />
                    <ClickHandler onMapClick={handleMapClick} />
                    <MapFlyTo lat={markerPos[0]} lon={markerPos[1]} />
                    <Marker position={markerPos} icon={pixelIcon} />
                </MapContainer>
            </div>

            <p className="map-attribution">
                Map © <a href="https://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
            </p>
        </div>
    );
}
