import { useState } from "react";
import "./CSS/Activate.css";

export default function Activate() {
  const [activeTab, setActiveTab] = useState("report");
  const [formData, setFormData] = useState({
    eventType: "",
    severity: "",
    location: "",
    description: "",
    affectedArea: "",
    estimatedCasualties: "",
    resourcesNeeded: "",
    contactPerson: "",
    contactNumber: "",
    coordinates: {
      latitude: "",
      longitude: ""
    }
  });

  const [disasterEvents, setDisasterEvents] = useState([
    {
      id: 1,
      eventType: "Flood",
      severity: "Critical",
      location: "Dehradun, Uttarakhand",
      description: "Heavy rainfall causing flash floods in multiple areas",
      affectedArea: "500 sq km",
      estimatedCasualties: "25+",
      resourcesNeeded: "Rescue boats, medical supplies, food",
      status: "Active",
      timestamp: "2024-01-15T10:30:00",
      contactPerson: "Col. Rajesh Kumar",
      contactNumber: "+91-98765-43210"
    },
    {
      id: 2,
      eventType: "Landslide",
      severity: "High",
      location: "Rishikesh, Uttarakhand",
      description: "Mountain slope collapse blocking NH-58",
      affectedArea: "2 sq km",
      estimatedCasualties: "5-10",
      resourcesNeeded: "Heavy machinery, medical teams",
      status: "Active",
      timestamp: "2024-01-15T09:15:00",
      contactPerson: "Dr. Priya Singh",
      contactNumber: "+91-98765-43211"
    }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEvent = {
      id: Date.now(),
      ...formData,
      status: "Active",
      timestamp: new Date().toISOString()
    };
    setDisasterEvents(prev => [newEvent, ...prev]);
    setFormData({
      eventType: "",
      severity: "",
      location: "",
      description: "",
      affectedArea: "",
      estimatedCasualties: "",
      resourcesNeeded: "",
      contactPerson: "",
      contactNumber: "",
      coordinates: {
        latitude: "",
        longitude: ""
      }
    });
    alert("Disaster Event reported successfully!");
  };

  const activateDisasterEvent = (eventId) => {
    setDisasterEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, status: "Activated", activatedAt: new Date().toISOString() }
          : event
      )
    );
    alert("Disaster Event activated successfully!");
  };

  const deactivateDisasterEvent = (eventId) => {
    setDisasterEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, status: "Deactivated", deactivatedAt: new Date().toISOString() }
          : event
      )
    );
    alert("Disaster Event deactivated successfully!");
  };

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

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "status-badge status-active";
      case "activated":
        return "status-badge status-activated";
      case "deactivated":
        return "status-badge status-deactivated";
      default:
        return "status-badge status-unknown";
    }
  };

  return (
    <div className="reports-container">
      {/* Page Title */}
      <div className="reports-page-header">
        <h2 className="reports-page-title">DISASTER EVENT MANAGEMENT SYSTEM</h2>
        <p className="reports-page-subtitle">
          Report and manage disaster events in real-time | Last Updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="reports-tab-nav">
        <button
          className={`reports-tab ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          Report the Event
        </button>
        <button
          className={`reports-tab ${activeTab === "activate" ? "active" : ""}`}
          onClick={() => setActiveTab("activate")}
        >
          Activate Disaster Event
        </button>
        <button
          className={`reports-tab ${activeTab === "manage" ? "active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          Manage Events
        </button>
      </div>

      {/* Tab Content */}
      <div className="reports-tab-content">
        {activeTab === "report" && (
          <div className="report-form-section">
            <div className="reports-section-header">
              <h3>REPORT NEW DISASTER EVENT</h3>
              <p>Fill in the details below to report a new disaster event</p>
            </div>

            <form onSubmit={handleSubmit} className="disaster-report-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="eventType">Event Type *</label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Event Type</option>
                    <option value="Flood">Flood</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Forest Fire">Forest Fire</option>
                    <option value="Avalanche">Avalanche</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Drought">Drought</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="severity">Severity Level *</label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Severity</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, District, State"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="affectedArea">Affected Area</label>
                  <input
                    type="text"
                    id="affectedArea"
                    name="affectedArea"
                    value={formData.affectedArea}
                    onChange={handleInputChange}
                    placeholder="e.g., 500 sq km"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedCasualties">Estimated Casualties</label>
                  <input
                    type="text"
                    id="estimatedCasualties"
                    name="estimatedCasualties"
                    value={formData.estimatedCasualties}
                    onChange={handleInputChange}
                    placeholder="e.g., 25+ or 5-10"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person *</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number *</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+91-98765-43210"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    type="number"
                    id="latitude"
                    name="coordinates.latitude"
                    value={formData.coordinates.latitude}
                    onChange={handleInputChange}
                    placeholder="30.3165"
                    step="any"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    type="number"
                    id="longitude"
                    name="coordinates.longitude"
                    value={formData.coordinates.longitude}
                    onChange={handleInputChange}
                    placeholder="78.0322"
                    step="any"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Event Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed description of the disaster event..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="resourcesNeeded">Resources Needed</label>
                <textarea
                  id="resourcesNeeded"
                  name="resourcesNeeded"
                  value={formData.resourcesNeeded}
                  onChange={handleInputChange}
                  placeholder="List required resources, equipment, and personnel..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Report Disaster Event
                </button>
                <button type="button" className="reset-btn" onClick={() => setFormData({
                  eventType: "",
                  severity: "",
                  location: "",
                  description: "",
                  affectedArea: "",
                  estimatedCasualties: "",
                  resourcesNeeded: "",
                  contactPerson: "",
                  contactNumber: "",
                  coordinates: { latitude: "", longitude: "" }
                })}>
                  Reset Form
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "activate" && (
          <div className="activate-section">
            <div className="reports-section-header">
              <h3>ACTIVATE DISASTER EVENT</h3>
              <p>Select and activate disaster events for immediate response</p>
            </div>

            <div className="events-grid">
              {disasterEvents.filter(event => event.status === "Active").map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <span className={getSeverityClass(event.severity)}>
                      {event.severity}
                    </span>
                    <span className={getStatusClass(event.status)}>
                      {event.status}
                    </span>
                  </div>
                  <h4 className="event-title">{event.eventType}</h4>
                  <p className="event-location">{event.location}</p>
                  <p className="event-description">{event.description}</p>
                  <div className="event-details">
                    <div className="detail-item">
                      <strong>Affected Area:</strong> {event.affectedArea}
                    </div>
                    <div className="detail-item">
                      <strong>Casualties:</strong> {event.estimatedCasualties}
                    </div>
                    <div className="detail-item">
                      <strong>Contact:</strong> {event.contactPerson}
                    </div>
                    <div className="detail-item">
                      <strong>Phone:</strong> {event.contactNumber}
                    </div>
                  </div>
                  <div className="event-actions">
                    <button
                      className="activate-btn"
                      onClick={() => activateDisasterEvent(event.id)}
                    >
                      Activate Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="manage-section">
            <div className="reports-section-header">
              <h3>MANAGE DISASTER EVENTS</h3>
              <p>Monitor and manage all reported disaster events</p>
            </div>

            <div className="events-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-number">{disasterEvents.length}</span>
                  <span className="stat-label">Total Events</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {disasterEvents.filter(e => e.status === "Active").length}
                  </span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {disasterEvents.filter(e => e.status === "Activated").length}
                  </span>
                  <span className="stat-label">Activated</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {disasterEvents.filter(e => e.severity === "Critical").length}
                  </span>
                  <span className="stat-label">Critical</span>
                </div>
              </div>
            </div>

            <div className="events-table-container">
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Reported</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disasterEvents.map(event => (
                    <tr key={event.id}>
                      <td className="event-id">#{event.id}</td>
                      <td>{event.eventType}</td>
                      <td>
                        <span className={getSeverityClass(event.severity)}>
                          {event.severity}
                        </span>
                      </td>
                      <td>{event.location}</td>
                      <td>
                        <span className={getStatusClass(event.status)}>
                          {event.status}
                        </span>
                      </td>
                      <td className="timestamp">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </td>
                      <td className="actions">
                        {event.status === "Active" && (
                          <button
                            className="action-btn activate"
                            onClick={() => activateDisasterEvent(event.id)}
                          >
                            Activate
                          </button>
                        )}
                        {event.status === "Activated" && (
                          <button
                            className="action-btn deactivate"
                            onClick={() => deactivateDisasterEvent(event.id)}
                          >
                            Deactivate
                          </button>
                        )}
                        <button className="action-btn view">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}