import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function SOSMap() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/sos");
      const data = await res.json();
      if (data && data.data) {
        const withCoords = data.data.filter(
          (a) => a.latitude != null && a.longitude != null
        );
        setAlerts(withCoords);
      }
    } catch (err) {
      console.error("Error fetching SOS alerts:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); 
    return () => clearInterval(interval);
  }, []);

  const defaultPosition = [20.5937, 78.9629]; 
  return (
    <div className="sosmap-container">
      <h2>SOS Alerts Map</h2>
      {loading && <p className="loading-text">Loading alerts...</p>}
      <MapContainer
        center={alerts.length > 0 ? [alerts[0].latitude, alerts[0].longitude] : defaultPosition}
        zoom={alerts.length > 0 ? 6 : 5}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        />

        {alerts.map((alert, index) => (
          <Marker
            key={index}
            position={[parseFloat(alert.latitude), parseFloat(alert.longitude)]}
          >
            <Popup>
              <strong>{alert.reporter}</strong>
              <br />
              Severity: {alert.severity || "UNKNOWN"}
              <br />
              {alert.description || "No description"}
              <br />
              {alert.timestamp
                ? new Date(alert.timestamp).toLocaleString()
                : ""}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}