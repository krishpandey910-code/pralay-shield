import { useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />

const LocationPicker = ({ latitude, longitude, onLocationSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const handleLocationSelect = useCallback((lat, lng) => {
    if (onLocationSelect) onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        const container = mapRef.current;
        if (!container || !latitude || !longitude) return;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }  if (container._leaflet_id) delete container._leaflet_id;
        const L = await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js');
        if (!isMounted || !mapRef.current) return;
        const map = L.map(container).setView([latitude, longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const createPopupContent = (lat, lng) => `
          <div style="text-align: center; padding: 5px;">
            <strong>📍 Disaster Location</strong><br>
            <small>Lat: ${lat.toFixed(6)}</small><br>
            <small>Lng: ${lng.toFixed(6)}</small><br>
            <em>Drag to adjust</em>
          </div>
        `;

        const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
        marker.bindPopup(createPopupContent(latitude, longitude)).openPopup();

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          handleLocationSelect(lat, lng);
          marker.bindPopup(createPopupContent(lat, lng)).openPopup();
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          handleLocationSelect(lat, lng);
          marker.bindPopup(createPopupContent(lat, lng)).openPopup();
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      if (mapRef.current && mapRef.current._leaflet_id) { delete mapRef.current._leaflet_id; }
      markerRef.current = null;
    };
  }, [latitude, longitude, handleLocationSelect]);

  if (!latitude || !longitude) {
    return (
      <div className="location-picker">
        <div className="map-header">
          <MapPin className="map-icon" />
          <div className="map-info">
            <h4 className="map-title">Location Preview</h4>
            <p className="map-description">Please provide coordinates to display map</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker">
      <div className="map-header">
        <MapPin className="map-icon" />
        <div className="map-info">
          <h4 className="map-title">Location Preview</h4>
          <p className="map-description">Click or drag the marker to adjust the exact location</p>
        </div>
      </div>

      <div ref={mapRef} className="location-map" style={{ height: '300px', width: '100%', borderRadius: '0.5rem', border: '1px solid #d1d5db', overflow: 'hidden' }} />

      <div className="map-coordinates">
        <div className="coordinate-display">
          <span className="coordinate-label">Coordinates: </span>
          <span className="coordinate-value">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;