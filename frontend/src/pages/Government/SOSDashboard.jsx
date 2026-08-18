import { useEffect, useState } from "react";
import "./CSS/SOSDashboard.css";
import SOSMap from "./SOSMap"; 
import SOSSupply from "./SOSSupply"
import Activate from "./Activate"

export default function GovtDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/sos");
      const data = await res.json();
      if (data && data.data) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "severity-badge severity-critical";
      case "high":
        return "severity-badge severity-high";
      case "medium":
        return "severity-badge severity-medium";
      case "low":
        return "severity-badge severity-low";
      default:
        return "severity-badge severity-unknown";
    }
  };

  const handleNavClick = (navItem) => {
    setActiveNav(navItem);
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return (
          <>
            {/* Page Title */}
            <div className="govt-page-header">
              <h2 className="govt-page-title">SOS ALERT MONITORING DASHBOARD</h2>
              <p className="govt-page-subtitle">
                Real-time monitoring of emergency distress signals | Last Updated:{" "}
                {new Date().toLocaleString()}
                {loading && <span className="loading-indicator">● Refreshing...</span>}
              </p>
            </div>

            {/* Summary Box */}
            <div className="govt-summary-box">
              <h3 className="govt-summary-title">ALERT SUMMARY</h3>
              <div className="govt-summary-grid">
                <div className="govt-summary-item">
                  <strong>Total Alerts:</strong> {alerts.length}
                </div>
                <div className="govt-summary-item">
                  <strong>Critical:</strong>{" "}
                  {alerts.filter((a) => a.severity?.toLowerCase() === "critical").length}
                </div>
                <div className="govt-summary-item">
                  <strong>High Priority:</strong>{" "}
                  {alerts.filter((a) => a.severity?.toLowerCase() === "high").length}
                </div>
                <div className="govt-summary-item">
                  <strong>System Status:</strong>{" "}
                  <span className="status-operational">OPERATIONAL</span>
                </div>
              </div>
            </div>

            {/* Alerts Table */}
            <div className="govt-table-container">
              <div className="govt-table-header">EMERGENCY ALERTS REGISTRY</div>

              {alerts.length === 0 ? (
                <div className="govt-no-data">
                  <p className="govt-no-data-title">NO ACTIVE ALERTS REGISTERED</p>
                  <p className="govt-no-data-subtitle">
                    System is actively monitoring for emergency situations
                  </p>
                </div>
              ) : (
                <table className="govt-table">
                  <thead>
                    <tr>
                      <th>SL. NO.</th>
                      <th>SEVERITY LEVEL</th>
                      <th>REPORTER NAME</th>
                      <th>INCIDENT DESCRIPTION</th>
                      <th>COORDINATES</th>
                      <th>DATE & TIME</th>
                      <th className="center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, index) => (
                      <tr key={index}>
                        <td className="serial-number">{String(index + 1).padStart(3, "0")}</td>
                        <td>
                          <span className={getSeverityClass(alert.severity)}>
                            {alert.severity || "UNKNOWN"}
                          </span>
                        </td>
                        <td>{alert.reporter || "NOT SPECIFIED"}</td>
                        <td>{alert.description || "NO DETAILS PROVIDED"}</td>
                        <td className="monospace">
                          {alert.latitude != null && alert.longitude != null
                            ? `${parseFloat(alert.latitude).toFixed(6)}, ${parseFloat(
                                alert.longitude
                              ).toFixed(6)}`
                            : "COORDINATES NOT AVAILABLE"}
                        </td>
                        <td className="monospace">
                          {alert.timestamp
                            ? new Date(alert.timestamp).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "TIME NOT RECORDED"}
                        </td>
                        <td className="center">
                          <button className="govt-action-btn">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        );

      case "track":
        return <SOSMap />;

      case "supplies":
        return <SOSSupply />; // placeholder

      case "reports":
        return <Activate />

      default:
        return null;
    }
  };

  return (
    <div className="govt-container">
      {/* Government Header */}
      <div className="govt-header">
        <div className="govt-header-content">
        <img
  src="https://tse1.mm.bing.net/th/id/OIP.Uc7lmWjrvY3haMicb-mczgHaHZ?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
  alt="Government Logo"
  className="govt-logo"
/>

          <div>
            <h1 className="govt-title">GOVERNMENT OF INDIA</h1>
            <h2 className="govt-subtitle">
              Ministry of Home Affairs - Emergency Response Division
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="govt-nav">
        <div className="govt-nav-content">
          <button
            className={`govt-nav-item ${activeNav === "dashboard" ? "active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`govt-nav-item ${activeNav === "track" ? "active" : ""}`}
            onClick={() => handleNavClick("track")}
          >
            Track
          </button>
          <button
            className={`govt-nav-item ${activeNav === "supplies" ? "active" : ""}`}
            onClick={() => handleNavClick("supplies")}
          >
            Supplies
          </button>
          <button
            className={`govt-nav-item ${activeNav === "reports" ? "active" : ""}`}
            onClick={() => handleNavClick("reports")}
          >
            Activate Alert
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="govt-breadcrumb">
        <div className="govt-breadcrumb-content">
          Home &gt; Emergency Services &gt;{" "}
          {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
        </div>
      </div>

      {/* Main Content */}
      <div className="govt-main">{renderContent()}</div>

      {/* Footer */}
      <div className="govt-footer">
        <p>© Government of India | Ministry of Home Affairs | Emergency Response Division</p>
        <p>
          This system is for official use only. Unauthorized access is prohibited under IT Act
          2000.
        </p>
        <p>For technical support contact: tech-support@mha.gov.in | Helpline: 1800-XXX-XXXX</p>
      </div>
    </div>
  );
}