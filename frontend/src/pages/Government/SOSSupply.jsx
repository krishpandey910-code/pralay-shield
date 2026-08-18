import { useState, useEffect } from "react";
import "./CSS/SOSSupply.css";

export default function SOSSupply() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("population");
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [allocationData, setAllocationData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [disasterForm, setDisasterForm] = useState({
    location: "Dehradun",
    disaster_type: "flash_flood",
    affected_area_percentage: 15,
    duration_days: 7,
    rainfall: 0,
    wind_speed: 0,
    humidity: 0,
    temperature: 0
  });
  
  const [resourceForm, setResourceForm] = useState({
    affected_population: 0,
    disaster_type: "flash_flood",
    duration_days: 7,
    rainfall: 0,
    wind_speed: 0,
    humidity: 0,
    temperature: 0
  });
  
  const [allocationForm, setAllocationForm] = useState({
    available_food: 500000,
    available_rescue_teams: 400,
    available_medical_staff: 700,
    disaster_name: "Dehradun Flood",
    disaster_location: "Dehradun",
    affected_people: 0,
    food_needed: 0,
    rescue_teams_needed: 0,
    medical_staff_needed: 0
  });

  // API Base URL
  const API_BASE = "http://localhost:5002";
  const WEATHER_API_KEY = "210d5062b95c6d926279c92dbf27770b"; 
  const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

  // Get current location and fetch weather data
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          await fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to default location
          fetchWeatherData(30.3165, 78.0322); // Dehradun coordinates
        }
      );
    } else {
      // Fallback to default location
      fetchWeatherData(30.3165, 78.0322); // Dehradun coordinates
    }
  }, []);

  // Fetch weather data from OpenWeatherMap API
  const fetchWeatherData = async (lat, lon) => {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (response.ok) {
        const data = await response.json();
        const weather = {
          rainfall: data.rain ? data.rain["1h"] || 0 : 0,
          wind_speed: data.wind ? data.wind.speed * 3.6 : 0, // Convert m/s to km/h
          humidity: data.main ? data.main.humidity : 0,
          temperature: data.main ? data.main.temp : 0
        };
        
        setWeatherData(weather);
        
        // Update forms with real weather data
        setDisasterForm(prev => ({
          ...prev,
          rainfall: weather.rainfall,
          wind_speed: weather.wind_speed,
          humidity: weather.humidity,
          temperature: weather.temperature
        }));
        
        setResourceForm(prev => ({
          ...prev,
          rainfall: weather.rainfall,
          wind_speed: weather.wind_speed,
          humidity: weather.humidity,
          temperature: weather.temperature
        }));
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Use default values if weather API fails
    }
  };

  // Helper function to call APIs
  const callAPI = async (endpoint, data, setter) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      setter(result);
      setError("");
    } catch (err) {
      console.error(`Error calling ${endpoint}:`, err);
      setError(`Failed to fetch data from ${endpoint}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // API Functions
  const predictPopulation = () => {
    const payload = {
      location: disasterForm.location,
      disaster_type: disasterForm.disaster_type,
      affected_area_percentage: parseInt(disasterForm.affected_area_percentage),
      weather_data: {
        rainfall: parseFloat(disasterForm.rainfall),
        wind_speed: parseFloat(disasterForm.wind_speed),
        humidity: parseFloat(disasterForm.humidity),
        temperature: parseFloat(disasterForm.temperature)
      }
    };
    callAPI("/api/predict-population", payload, setPopulationData);
  };

  const calculateResources = () => {
    // Use predicted population if available, otherwise use form input
    const affectedPopulation = populationData?.prediction?.predicted_affected_population || 
                              parseInt(resourceForm.affected_population);
    
    const payload = {
      affected_population: affectedPopulation,
      disaster_type: resourceForm.disaster_type,
      duration_days: parseInt(resourceForm.duration_days),
      weather_data: {
        rainfall: parseFloat(resourceForm.rainfall),
        wind_speed: parseFloat(resourceForm.wind_speed),
        humidity: parseFloat(resourceForm.humidity),
        temperature: parseFloat(resourceForm.temperature)
      }
    };
    callAPI("/api/calculate-resources", payload, setResourceData);
  };

  const allocateResources = () => {
    const payload = {
      available_resources: {
        food_packets: parseInt(allocationForm.available_food),
        rescue_teams: parseInt(allocationForm.available_rescue_teams),
        medical_staff: parseInt(allocationForm.available_medical_staff)
      },
      disasters: [{
        name: allocationForm.disaster_name,
        location: allocationForm.disaster_location,
        affected_people: parseInt(allocationForm.affected_people),
        food_needed: parseInt(allocationForm.food_needed),
        rescue_teams_needed: parseInt(allocationForm.rescue_teams_needed),
        medical_staff_needed: parseInt(allocationForm.medical_staff_needed)
      }]
    };
    callAPI("/api/allocate-resources", payload, setAllocationData);
  };

  const runFullAnalysis = () => {
    const payload = {
      disaster_info: {
        location: disasterForm.location,
        disaster_type: disasterForm.disaster_type,
        affected_area_percentage: parseInt(disasterForm.affected_area_percentage),
        duration_days: parseInt(disasterForm.duration_days)
      },
      weather_data: {
        rainfall: parseFloat(disasterForm.rainfall),
        wind_speed: parseFloat(disasterForm.wind_speed),
        humidity: parseFloat(disasterForm.humidity),
        temperature: parseFloat(disasterForm.temperature)
      },
      available_resources: {
        food_packets: parseInt(allocationForm.available_food),
        rescue_teams: parseInt(allocationForm.available_rescue_teams),
        medical_staff: parseInt(allocationForm.available_medical_staff)
      }
    };
    callAPI("/api/full-disaster-analysis", payload, setAnalysisData);
  };

  const handleInputChange = (formType, field, value) => {
    if (formType === 'disaster') {
      setDisasterForm(prev => ({ ...prev, [field]: value }));
    } else if (formType === 'resource') {
      setResourceForm(prev => ({ ...prev, [field]: value }));
    } else if (formType === 'allocation') {
      setAllocationForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Auto-update resource form when population prediction is available
  useEffect(() => {
    if (populationData?.prediction?.predicted_affected_population) {
      const predictedPopulation = populationData.prediction.predicted_affected_population;
      setResourceForm(prev => ({
        ...prev,
        affected_population: predictedPopulation
      }));
      
      // Also update allocation form
      setAllocationForm(prev => ({
        ...prev,
        affected_people: predictedPopulation
      }));
    }
  }, [populationData]);

  // Auto-update allocation form when resource calculation is available
  useEffect(() => {
    if (resourceData?.resource_calculation?.calculated_resources) {
      const resources = resourceData.resource_calculation.calculated_resources;
      
      setAllocationForm(prev => ({
        ...prev,
        food_needed: resources.food?.final_amount?.food_packets || 0,
        rescue_teams_needed: resources.rescue?.final_amount?.rescue_teams || 0,
        medical_staff_needed: resources.medical?.final_amount?.medical_staff || 0
      }));
    }
  }, [resourceData]);

  const renderPopulationTab = () => (
    <div className="supply-tab-content">
      <div className="supply-form-section">
        <h3>Population Prediction Parameters</h3>
        
        {/* Weather Data Display */}
        {weatherData && (
          <div className="weather-info">
            <h4>🌤️ Current Weather Data </h4>
            <div className="weather-grid">
              <div className="weather-item">
                <span className="weather-label">Rainfall:</span>
                <span className="weather-value">{weatherData.rainfall.toFixed(1)} mm</span>
              </div>
              <div className="weather-item">
                <span className="weather-label">Wind Speed:</span>
                <span className="weather-value">{weatherData.wind_speed.toFixed(1)} km/h</span>
              </div>
              <div className="weather-item">
                <span className="weather-label">Humidity:</span>
                <span className="weather-value">{weatherData.humidity}%</span>
              </div>
              <div className="weather-item">
                <span className="weather-label">Temperature:</span>
                <span className="weather-value">{weatherData.temperature.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              value={disasterForm.location}
              onChange={(e) => handleInputChange('disaster', 'location', e.target.value)}
              placeholder="Enter location"
            />
          </div>
          <div className="form-group">
            <label>Disaster Type:</label>
            <select
              value={disasterForm.disaster_type}
              onChange={(e) => handleInputChange('disaster', 'disaster_type', e.target.value)}
            >
              <option value="flash_flood">Flash Flood</option>
              <option value="earthquake">Earthquake</option>
              <option value="landslide">Landslide</option>
              <option value="forest_fire">Forest Fire</option>
              <option value="cyclone">Cyclone</option>
            </select>
          </div>
          <div className="form-group">
            <label>Affected Area (%):</label>
            <input
              type="number"
              value={disasterForm.affected_area_percentage}
              onChange={(e) => handleInputChange('disaster', 'affected_area_percentage', e.target.value)}
              min="1"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Duration (Days):</label>
            <input
              type="number"
              value={disasterForm.duration_days}
              onChange={(e) => handleInputChange('disaster', 'duration_days', e.target.value)}
              min="1"
              max="30"
            />
          </div>
        </div>
        <button 
          className="supply-action-btn"
          onClick={predictPopulation}
          disabled={loading}
        >
          {loading ? "⏳ Processing..." : "🚨 Predict Population Impact"}
        </button>
      </div>

      {populationData && (
        <div className="supply-result-section">
          <h3>Population Prediction Results</h3>
          <div className="result-grid">
            <div className="result-card">
              <h4>Predicted Affected Population</h4>
              <div className="result-value">
                {populationData.prediction?.predicted_affected_population?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <h4>Location</h4>
              <div className="result-value">{populationData.prediction?.location || 'N/A'}</div>
            </div>
            <div className="result-card">
              <h4>Disaster Type</h4>
              <div className="result-value">{populationData.prediction?.disaster_type?.replace('_', ' ').toUpperCase() || 'N/A'}</div>
            </div>
            <div className="result-card">
              <h4>ML Confidence</h4>
              <div className="result-value">{populationData.prediction?.ml_confidence || 'N/A'}</div>
            </div>
          </div>
          <div className="weather-factors">
            <h4>Weather Factors Applied</h4>
            <pre>{JSON.stringify(populationData.prediction?.weather_factors_applied || {}, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderResourceTab = () => (
    <div className="supply-tab-content">
      <div className="supply-form-section">
        <h3>Resource Calculation Parameters</h3>
        
        {/* Population Info */}
        {populationData?.prediction?.predicted_affected_population && (
          <div className="population-info">
            <h4>👥 Population Data </h4>
            <div className="info-item">
              <span className="info-label">Predicted Affected Population:</span>
              <span className="info-value">{populationData.prediction.predicted_affected_population.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>Affected Population:</label>
            <input
              type="number"
              value={resourceForm.affected_population}
              onChange={(e) => handleInputChange('resource', 'affected_population', e.target.value)}
              min="1"
              placeholder="Will auto-fill from population prediction"
            />
          </div>
          <div className="form-group">
            <label>Disaster Type:</label>
            <select
              value={resourceForm.disaster_type}
              onChange={(e) => handleInputChange('resource', 'disaster_type', e.target.value)}
            >
              <option value="flash_flood">Flash Flood</option>
              <option value="earthquake">Earthquake</option>
              <option value="landslide">Landslide</option>
              <option value="forest_fire">Forest Fire</option>
              <option value="cyclone">Cyclone</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duration (Days):</label>
            <input
              type="number"
              value={resourceForm.duration_days}
              onChange={(e) => handleInputChange('resource', 'duration_days', e.target.value)}
              min="1"
              max="30"
            />
          </div>
        </div>
        <button 
          className="supply-action-btn"
          onClick={calculateResources}
          disabled={loading}
        >
          {loading ? "⏳ Processing..." : "📊 Calculate Resource Needs"}
        </button>
      </div>

      {resourceData && (
        <div className="supply-result-section">
          <h3>Resource Calculation Results</h3>
          <div className="result-grid">
            <div className="result-card">
              <h4>Food Packets Needed</h4>
              <div className="result-value">
                {resourceData.resource_calculation?.calculated_resources?.food?.final_amount?.food_packets?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <h4>Rescue Teams Needed</h4>
              <div className="result-value">
                {resourceData.resource_calculation?.calculated_resources?.rescue?.final_amount?.rescue_teams?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <h4>Medical Staff Needed</h4>
              <div className="result-value">
                {resourceData.resource_calculation?.calculated_resources?.medical?.final_amount?.medical_staff?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <h4>Duration</h4>
              <div className="result-value">{resourceData.resource_calculation?.duration_days || 'N/A'} days</div>
            </div>
          </div>
          
          
        </div>
      )}
    </div>
  );

  const renderAllocationTab = () => (
    <div className="supply-tab-content">
      <div className="supply-form-section">
        <h3>Resource Allocation Parameters</h3>
        
        {/* Auto-filled Resource Info */}
        {resourceData?.resource_calculation?.calculated_resources && (
          <div className="resource-info">
            <h4>📦 Resource Requirements </h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Food Needed:</span>
                <span className="info-value">{resourceData.resource_calculation.calculated_resources.food?.final_amount?.food_packets?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Rescue Teams Needed:</span>
                <span className="info-value">{resourceData.resource_calculation.calculated_resources.rescue?.final_amount?.rescue_teams?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Medical Staff Needed:</span>
                <span className="info-value">{resourceData.resource_calculation.calculated_resources.medical?.final_amount?.medical_staff?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>Available Food Packets:</label>
            <input
              type="number"
              value={allocationForm.available_food}
              onChange={(e) => handleInputChange('allocation', 'available_food', e.target.value)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Available Rescue Teams:</label>
            <input
              type="number"
              value={allocationForm.available_rescue_teams}
              onChange={(e) => handleInputChange('allocation', 'available_rescue_teams', e.target.value)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Available Medical Staff:</label>
            <input
              type="number"
              value={allocationForm.available_medical_staff}
              onChange={(e) => handleInputChange('allocation', 'available_medical_staff', e.target.value)}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Disaster Name:</label>
            <input
              type="text"
              value={allocationForm.disaster_name}
              onChange={(e) => handleInputChange('allocation', 'disaster_name', e.target.value)}
              placeholder="Enter disaster name"
            />
          </div>
          <div className="form-group">
            <label>Disaster Location:</label>
            <input
              type="text"
              value={allocationForm.disaster_location}
              onChange={(e) => handleInputChange('allocation', 'disaster_location', e.target.value)}
              placeholder="Enter location"
            />
          </div>
          <div className="form-group">
            <label>Affected People:</label>
            <input
              type="number"
              value={allocationForm.affected_people}
              onChange={(e) => handleInputChange('allocation', 'affected_people', e.target.value)}
              min="1"
              placeholder=" from populatAuto-filledion prediction"
            />
          </div>
          <div className="form-group">
            <label>Food Needed:</label>
            <input
              type="number"
              value={allocationForm.food_needed}
              onChange={(e) => handleInputChange('allocation', 'food_needed', e.target.value)}
              min="0"
              placeholder="Auto-filled from resource calculation"
            />
          </div>
          <div className="form-group">
            <label>Rescue Teams Needed:</label>
            <input
              type="number"
              value={allocationForm.rescue_teams_needed}
              onChange={(e) => handleInputChange('allocation', 'rescue_teams_needed', e.target.value)}
              min="0"
              placeholder="Auto-filled from resource calculation"
            />
          </div>
          <div className="form-group">
            <label>Medical Staff Needed:</label>
            <input
              type="number"
              value={allocationForm.medical_staff_needed}
              onChange={(e) => handleInputChange('allocation', 'medical_staff_needed', e.target.value)}
              min="0"
              placeholder="Auto-filled from resource calculation"
            />
          </div>
        </div>
        <button 
          className="supply-action-btn"
          onClick={allocateResources}
          disabled={loading}
        >
          {loading ? "⏳ Processing..." : "⚖️ Allocate Resources"}
        </button>
      </div>

      {allocationData && (
        <div className="supply-result-section">
          <h3>Resource Allocation Results</h3>
          <div className="result-grid">
            <div className="result-card">
              <h4>Disasters Processed</h4>
              <div className="result-value">{allocationData.resource_allocation?.disasters_processed || 'N/A'}</div>
            </div>
            <div className="result-card">
              <h4>Food Wastage</h4>
              <div className="result-value">
                {allocationData.resource_allocation?.wastage_analysis?.food_wastage?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <h4>Rescue Teams Wastage</h4>
              <div className="result-value">
                {allocationData.resource_allocation?.wastage_analysis?.rescue_wastage?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="result-card">
              <h4>Medical Staff Wastage</h4>
              <div className="result-value">
                {allocationData.resource_allocation?.wastage_analysis?.medical_wastage?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>
          <div className="allocation-details">
            <h4>Allocation Details</h4>
            <pre>{JSON.stringify(allocationData.resource_allocation?.allocations || {}, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="supply-tab-content">
      <div className="supply-form-section">
        <h3>Full Disaster Analysis</h3>
        <p className="analysis-description">
          This comprehensive analysis combines population prediction, resource calculation, and smart allocation
          to provide a complete disaster response plan.
        </p>
        <button 
          className="supply-action-btn analysis-btn"
          onClick={runFullAnalysis}
          disabled={loading}
        >
          {loading ? "⏳ Running Full Analysis..." : "🔬 Run Complete Disaster Analysis"}
        </button>
      </div>

      {analysisData && (
        <div className="supply-result-section">
          <h3>Complete Disaster Analysis Results</h3>
          
          {/* Population Prediction Summary */}
          <div className="analysis-section">
            <h4>📊 Population Prediction</h4>
            <div className="result-grid">
              <div className="result-card">
                <h5>Predicted Affected Population</h5>
                <div className="result-value">
                  {analysisData.full_analysis?.step_1_population_prediction?.predicted_affected_population?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="result-card">
                <h5>ML Confidence</h5>
                <div className="result-value">
                  {analysisData.full_analysis?.step_1_population_prediction?.ml_confidence || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Resource Calculation Summary */}
          <div className="analysis-section">
            <h4>📦 Resource Requirements</h4>
            <div className="result-grid">
              <div className="result-card">
                <h5>Food Needed</h5>
                <div className="result-value">
                  {analysisData.full_analysis?.step_2_resource_calculation?.calculated_resources?.food?.final_amount?.food_packets?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="result-card">
                <h5>Rescue Teams Needed</h5>
                <div className="result-value">
                  {analysisData.full_analysis?.step_2_resource_calculation?.calculated_resources?.rescue?.final_amount?.rescue_teams?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="result-card">
                <h5>Medical Staff Needed</h5>
                <div className="result-value">
                  {analysisData.full_analysis?.step_2_resource_calculation?.calculated_resources?.medical?.final_amount?.medical_staff?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Resource Allocation Summary */}
          {analysisData.full_analysis?.step_3_resource_allocation?.allocations && (
            <div className="analysis-section">
              <h4>⚖️ Resource Allocation</h4>
              <div className="result-grid">
                <div className="result-card">
                  <h5>Available Food</h5>
                  <div className="result-value">
                    {analysisData.full_analysis?.step_3_resource_allocation?.available_resources?.food_packets?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div className="result-card">
                  <h5>Available Rescue Teams</h5>
                  <div className="result-value">
                    {analysisData.full_analysis?.step_3_resource_allocation?.available_resources?.rescue_teams?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                <div className="result-card">
                  <h5>Available Medical Staff</h5>
                  <div className="result-value">
                    {analysisData.full_analysis?.step_3_resource_allocation?.available_resources?.medical_staff?.toLocaleString() || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}

          
    </div>
        )}
        </div>
  );

  return (
    <div className="supply-container">
      {/* Page Header */}
      <div className="supply-page-header">
        <h2 className="supply-page-title">SUPPLY MANAGEMENT & RESOURCE COORDINATION</h2>
        <p className="supply-page-subtitle">
          AI-Powered Disaster Response Planning | ML-Based Resource Optimization | Smart Allocation Systems
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="supply-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="supply-tab-nav">
        <button
          className={`supply-tab-btn ${activeTab === "population" ? "active" : ""}`}
          onClick={() => setActiveTab("population")}
        >
          🚨 Population Prediction
        </button>
        <button
          className={`supply-tab-btn ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setActiveTab("resources")}
        >
          📊 Resource Calculation
        </button>
        <button
          className={`supply-tab-btn ${activeTab === "allocation" ? "active" : ""}`}
          onClick={() => setActiveTab("allocation")}
        >
          ⚖️ Resource Allocation
        </button>
        <button
          className={`supply-tab-btn ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          🔬 Full Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="supply-content">
        {activeTab === "population" && renderPopulationTab()}
        {activeTab === "resources" && renderResourceTab()}
        {activeTab === "allocation" && renderAllocationTab()}
        {activeTab === "analysis" && renderAnalysisTab()}
      </div>

      {/* System Status */}
      <div className="supply-status">
        <div className="status-item">
          <span className="status-label">API Status:</span>
          <span className="status-value operational">OPERATIONAL</span>
        </div>
        <div className="status-item">
          <span className="status-label">ML Systems:</span>
          <span className="status-value operational">ACTIVE</span>
        </div>
       
        <div className="status-item">
          <span className="status-label">Last Updated:</span>
          <span className="status-value">{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}