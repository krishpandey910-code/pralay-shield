import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_API_URL;
const API_KEY = '210d5062b95c6d926279c92dbf27770b';
const CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const ALERTS_URL = 'https://api.openweathermap.org/data/2.5/onecall';

const WEATHER_ICON_MAP = {
  'Clear': '☀️',
  'Clouds': '☁️',
  'Rain': '🌧️',
  'Drizzle': '🌦️',
  'Thunderstorm': '⛈️',
  'Snow': '❄️',
  'Mist': '🌫️',
  'Smoke': '🌫️',
  'Haze': '🌫️',
  'Dust': '🌫️',
  'Fog': '🌫️',
  'Sand': '🌫️',
  'Ash': '🌫️',
  'Squall': '💨',
  'Tornado': '🌪️'
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Severity levels for alerts
const ALERT_SEVERITY = {
  extreme: { color: '#DC2626', icon: '🚨', label: 'EXTREME' },
  severe: { color: '#EA580C', icon: '⚠️', label: 'SEVERE' },
  moderate: { color: '#F59E0B', icon: '⚡', label: 'MODERATE' },
  minor: { color: '#3B82F6', icon: 'ℹ️', label: 'MINOR' }
};

// Compact Header for Weather Page
const CompactHeader = ({ section }) => {
  const [curTab, setCurTab] = useState(section ?? "Weather");
  const TABS = ["Home", "Weather", "SOS", "SafeHouses", "Social"];

  const handleTabClick = (tab) => {
    setCurTab(tab);
    const path = tab === "Home" ? "/user" : `/user/${tab}`;
    window.location.href = path;
  };

  const styles = {
    header: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 40px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 100
    },
    logo: {
      height: '40px',
      width: 'auto',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center'
    },
    navbar: {
      display: 'flex',
      gap: '25px',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    navLink: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '600',
      padding: '8px 14px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      border: 'none',
      background: 'transparent'
    },
    navLinkActive: {
      backgroundColor: '#ED0707',
      color: 'white',
      boxShadow: '0 4px 12px rgba(237, 7, 7, 0.4)'
    }
  };

  return (
    <div style={styles.header}>
      <style>{`
        nav a:hover {
          transform: translateY(-1px);
        }
      `}</style>
      
      <img style={styles.logo} src="./../../assets/Disaster-Relief.jpeg" alt="App Logo" />
      <div style={styles.rightSection}>
        <nav style={styles.navbar}>
          {TABS.map(tab => (
            <a
              key={tab}
              style={{
                ...styles.navLink,
                ...(curTab === tab ? styles.navLinkActive : {})
              }}
              href={`/user/${tab === "Home" ? "" : tab}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(tab);
              }}
            >
              {tab}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

// Weather Alerts Component
const WeatherAlertsSection = ({ alerts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="weather-alerts">
        <div className="alerts-header">
          <h3>🚨 LIVE WEATHER ALERTS</h3>
          <span className="alert-badge loading">Loading...</span>
        </div>
        <div className="alerts-loading">
          <span className="spinner"></span>
          <p>Checking for weather alerts...</p>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="weather-alerts">
        <div className="alerts-header">
          <h3>🚨 LIVE WEATHER ALERTS</h3>
          <span className="alert-badge safe">0 Active</span>
        </div>
        <div className="no-alerts">
          <div className="no-alerts-icon">✅</div>
          <h4>No Active Alerts</h4>
          <p>There are currently no weather alerts for your location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-alerts">
      <div className="alerts-header">
        <h3>🚨 LIVE WEATHER ALERTS</h3>
        <span className="alert-badge active">{alerts.length} Active</span>
      </div>
      <div className="alerts-list">
        {alerts.map((alert, index) => {
          const severity = alert.tags?.[0]?.toLowerCase() || 'minor';
          const severityInfo = ALERT_SEVERITY[severity] || ALERT_SEVERITY.minor;
          const startDate = new Date(alert.start * 1000);
          const endDate = new Date(alert.end * 1000);
          
          return (
            <div key={index} className="alert-card" style={{ borderLeftColor: severityInfo.color }}>
              <div className="alert-header">
                <div className="alert-severity" style={{ backgroundColor: severityInfo.color }}>
                  <span className="alert-severity-icon">{severityInfo.icon}</span>
                  <span className="alert-severity-label">{severityInfo.label}</span>
                </div>
                <div className="alert-time">
                  {startDate.toLocaleDateString()}
                </div>
              </div>
              <h4 className="alert-title">{alert.event}</h4>
              <p className="alert-description">{alert.description}</p>
              <div className="alert-footer">
                <span className="alert-source">Source: {alert.sender_name}</span>
                <span className="alert-duration">
                  Until {endDate.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState({
    cityName: '',
    temperature: '—',
    description: 'Loading...',
    icon: '⏳',
    feelsLike: '—',
    windSpeed: '—',
    rainChance: '—',
    uvIndex: '—'
  });
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [citySearch, setCitySearch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const getWeatherIcon = (weatherMain) => {
    return WEATHER_ICON_MAP[weatherMain] || '☀️';
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // Fetch weather alerts
  const fetchWeatherAlerts = async (lat, lon) => {
    setAlertsLoading(true);
    try {
      const response = await fetch(
        `${ALERTS_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,current&appid=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.alerts && data.alerts.length > 0) {
        setWeatherAlerts(data.alerts);
        // Store alert count in window for dashboard access
        window.weatherAlertCount = data.alerts.length;
      } else {
        setWeatherAlerts([]);
        window.weatherAlertCount = 0;
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      setWeatherAlerts([]);
      window.weatherAlertCount = 0;
    } finally {
      setAlertsLoading(false);
    }
  };

  // Export function to get alert count (can be called from dashboard)
  useEffect(() => {
    window.getWeatherAlertCount = () => {
      return weatherAlerts.length;
    };
    
    window.getWeatherAlerts = () => {
      return weatherAlerts;
    };
  }, [weatherAlerts]);

  const updateUserCity = async (email, city) => {
    try {
      const response = await fetch(`${BACKEND_URL}/update-city`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, city }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Error updating city:', data.error);
      }
    } catch (error) {
      console.error('Error updating city:', error);
    }
  };

  const checkForRainAlert = async (weatherInfo) => {
    if (!weatherInfo.cityName) return;

    const rainChance = parseInt(weatherInfo.rainChance.replace('%', ''));
    const description = weatherInfo.description.toLowerCase();
    const hasRain = rainChance > 30 || 
                    description.includes('rain') || 
                    description.includes('storm') || 
                    description.includes('thunder') || 
                    description.includes('drizzle') || 
                    description.includes('shower');

    if (hasRain && isRegistered && userEmail) {
      try {
        const response = await fetch(`${BACKEND_URL}/check-weather-immediate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, cityName: weatherInfo.cityName }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          if (data.severity && data.severity !== 'NONE') {
            setRegistrationStatus(`⚠️ Weather alert sent! Severity: ${data.severity}`);
          } else {
            setRegistrationStatus(data.message);
          }
        } else {
          showError('Error checking weather. Please try again.');
        }
      } catch (error) {
        console.error('Error checking weather:', error);
        showError('Error checking weather. Is the backend server running?');
      }
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    if (!cityName.trim()) {
      showError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${CURRENT_WEATHER_URL}?q=${cityName}&appid=${API_KEY}&units=metric`);
      if (!response.ok) throw new Error('City not found');

      const data = await response.json();
      const coords = { lat: data.coord.lat, lon: data.coord.lon };
      setCurrentCoords(coords);
      
      const newWeatherData = {
        cityName: data.name,
        temperature: `${Math.round(data.main.temp)}°C`,
        description: data.weather[0].description,
        icon: getWeatherIcon(data.weather[0].main),
        feelsLike: `${Math.round(data.main.feels_like)}°C`,
        windSpeed: `${(data.wind.speed * 3.6).toFixed(1)} km/h`,
        rainChance: `${data.clouds.all}%`,
        uvIndex: '3',
        humidity: `${data.main.humidity}%`,
        pressure: `${data.main.pressure} mb`
      };

      setWeatherData(newWeatherData);
      checkForRainAlert(newWeatherData);

      if (isRegistered && userEmail) {
        updateUserCity(userEmail, newWeatherData.cityName);
      }

      fetchForecastData(coords.lat, coords.lon);
      fetchWeatherAlerts(coords.lat, coords.lon);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      showError('City not found. Please try another search.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForecastData = async (lat, lon) => {
    try {
      const response = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      const data = await response.json();

      const hourlyData = data.list.slice(0, 6).map(item => {
        const time = new Date(item.dt * 1000);
        const hour = time.getHours();
        const displayTime = hour === 0 ? '12:00 AM' : 
                           hour < 12 ? `${hour}:00 AM` : 
                           hour === 12 ? '12:00 PM' : 
                           `${hour - 12}:00 PM`;
        return {
          time: displayTime,
          icon: getWeatherIcon(item.weather[0].main),
          temp: `${Math.round(item.main.temp)}°`,
          description: item.weather[0].main
        };
      });
      setHourlyForecast(hourlyData);

      const dailyData = groupForecastByDay(data.list);
      const processedDaily = Object.keys(dailyData).slice(0, 7).map((date, index) => {
        const dayData = dailyData[date];
        const dateObj = new Date(date);
        const dayName = index === 0 ? 'Today' : DAYS_OF_WEEK[dateObj.getDay()];
        const temps = dayData.map(item => item.main.temp);
        const maxTemp = Math.round(Math.max(...temps));
        const minTemp = Math.round(Math.min(...temps));
        const weather = dayData[0].weather[0].main;
        const description = dayData[0].weather[0].description;

        return {
          day: dayName,
          icon: getWeatherIcon(weather),
          desc: description,
          high: maxTemp.toString(),
          low: minTemp.toString()
        };
      });
      setDailyForecast(processedDaily);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      showError('Failed to load forecast data.');
    }
  };

  const groupForecastByDay = (forecastData) => {
    const grouped = {};
    forecastData.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
    return grouped;
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    setErrorMessage('');
    
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const coords = { lat, lon };
        setCurrentCoords(coords);
        
        try {
          const response = await fetch(`${CURRENT_WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
          const data = await response.json();
          const newWeatherData = {
            cityName: data.name,
            temperature: `${Math.round(data.main.temp)}°C`,
            description: data.weather[0].description,
            icon: getWeatherIcon(data.weather[0].main),
            feelsLike: `${Math.round(data.main.feels_like)}°C`,
            windSpeed: `${(data.wind.speed * 3.6).toFixed(1)} km/h`,
            rainChance: `${data.clouds.all}%`,
            uvIndex: '3',
            humidity: `${data.main.humidity}%`,
            pressure: `${data.main.pressure} mb`
          };
          setWeatherData(newWeatherData);
          checkForRainAlert(newWeatherData);
          if (isRegistered && userEmail) {
            updateUserCity(userEmail, newWeatherData.cityName);
          }
          fetchForecastData(lat, lon);
          fetchWeatherAlerts(lat, lon);
        } catch (error) {
          console.error('Error fetching weather data:', error);
          showError('Unable to fetch weather data. Trying default city...');
          fetchWeatherByCity('Madrid');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        showError('Location access denied. Loading default city.');
        fetchWeatherByCity('Madrid');
      }
    );
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const city = citySearch.trim();
      if (city) {
        fetchWeatherByCity(city);
        setCitySearch('');
      }
    }
  };

  const handleSearchClick = () => {
    const city = citySearch.trim();
    if (city) {
      fetchWeatherByCity(city);
      setCitySearch('');
    } else {
      showError('Please enter a city name');
    }
  };

  const handleEmailRegistration = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      showError('Please enter a valid email address.');
      return;
    }

    if (!weatherData.cityName) {
      showError('Please search for a city first.');
      return;
    }

    setIsLoading(true);
    setRegistrationStatus('Registering...');
    setErrorMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          city: weatherData.cityName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsRegistered(true);
        setRegistrationStatus('✅ Successfully registered for weather alerts!');
      } else {
        setRegistrationStatus(`❌ Registration failed: ${data.error}`);
        showError(data.error);
      }
    } catch (error) {
      console.error('Error registering for alerts:', error);
      setRegistrationStatus('❌ Failed to register.');
      showError('Failed to register. Check backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="weather-app">
      <style>{`
        .weather-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .weather-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Weather Alerts Styles */
        .weather-alerts {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .alerts-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .alert-badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .alert-badge.safe {
          background: #d1fae5;
          color: #065f46;
        }

        .alert-badge.active {
          background: #fee2e2;
          color: #991b1b;
          animation: pulse 2s ease-in-out infinite;
        }

        .alert-badge.loading {
          background: #e5e7eb;
          color: #6b7280;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .alerts-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          color: #6b7280;
        }

        .no-alerts {
          text-align: center;
          padding: 40px 20px;
        }

        .no-alerts-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-alerts h4 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #1f2937;
        }

        .no-alerts p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-left: 4px solid;
          border-radius: 12px;
          padding: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .alert-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .alert-severity {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 6px;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .alert-severity-icon {
          font-size: 14px;
        }

        .alert-time {
          font-size: 12px;
          color: #6b7280;
        }

        .alert-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .alert-description {
          margin: 0 0 12px 0;
          font-size: 14px;
          line-height: 1.6;
          color: #4b5563;
        }

        .alert-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        /* Existing styles */
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
          margin-right: 10px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .toast-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 9998;
        }

        .toast-message {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 24px 32px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          display: flex;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
        }

        .toast-message.processing {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .toast-message.error {
          background: #fee;
          color: #c33;
          cursor: pointer;
        }

        .email-registration, .registration-success {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .email-registration h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #1f2937;
        }

        .email-registration p {
          margin: 0 0 20px 0;
          color: #6b7280;
        }

        .registration-input-group {
          display: flex;
          gap: 12px;
        }

        .email-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .email-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .register-btn, .check-weather-btn {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .register-btn:hover, .check-weather-btn:hover {
          background: #5568d3;
        }

        .register-btn:disabled, .check-weather-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .registration-status {
          margin-top: 12px;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .registration-status.success {
          background: #d1fae5;
          color: #065f46;
        }

        .registration-status.error {
          background: #fee;
          color: #c33;
        }

        .registration-success {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .success-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .success-icon {
          font-size: 32px;
        }

        .success-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }

        .success-header p {
          margin: 4px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .status-message {
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
          color: #4b5563;
        }

        .manual-check-section {
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .search-bar {
          display: flex;
          gap: 12px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .city-search {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
        }

        .city-search:focus {
          outline: none;
          border-color: #667eea;
        }

        .search-btn, .location-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-btn {
          background: #667eea;
          color: white;
        }

        .search-btn:hover {
          background: #5568d3;
        }

        .location-btn {
          background: #10b981;
          color: white;
        }

        .location-btn:hover {
          background: #059669;
        }

        .search-btn:disabled, .location-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .weather-main {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .city-info h1 {
          margin: 0 0 8px 0;
          font-size: 36px;
          color: #1f2937;
        }

        .weather-description {
          margin: 0;
          font-size: 18px;
          color: #6b7280;
          text-transform: capitalize;
        }

        .current-temp {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .temperature {
          font-size: 64px;
          font-weight: 700;
          color: #1f2937;
        }

        .weather-icon {
          font-size: 64px;
        }

        .hourly-forecast {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .hourly-forecast h3 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .hourly-container {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .hourly-item {
          text-align: center;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .hourly-item:hover {
          background: #f3f4f6;
        }

        .hourly-time {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .hourly-icon {
          font-size: 32px;
          margin: 8px 0;
        }

        .hourly-temp {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .air-conditions {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .conditions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .conditions-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .see-more {
          background: transparent;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .conditions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .condition-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .condition-icon {
          font-size: 32px;
        }

        .condition-info {
          display: flex;
          flex-direction: column;
        }

        .condition-label {
          font-size: 13px;
          color: #6b7280;
        }

        .condition-value {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .forecast-sidebar {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .forecast-sidebar h3 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .daily-forecast {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .daily-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          transition: background 0.2s;
        }

        .daily-item:hover {
          background: #f3f4f6;
        }

        .daily-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .daily-day {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          min-width: 60px;
        }

        .daily-icon {
          font-size: 28px;
        }

        .daily-desc {
          font-size: 13px;
          color: #6b7280;
          text-transform: capitalize;
        }

        .daily-temps {
          font-size: 16px;
          font-weight: 600;
        }

        .daily-high {
          color: #1f2937;
        }

        .daily-low {
          color: #9ca3af;
        }

        @media (max-width: 1200px) {
          .weather-container {
            grid-template-columns: 1fr;
          }

          .hourly-container {
            grid-template-columns: repeat(3, 1fr);
          }

          .conditions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hourly-container {
            grid-template-columns: repeat(2, 1fr);
          }

          .conditions-grid {
            grid-template-columns: 1fr;
          }

          .search-bar {
            flex-direction: column;
          }
        }
      `}</style>

      {isLoading && (
        <>
          <div className="toast-overlay" />
          <div className="toast-message processing">
            <span className="spinner"></span> Loading Weather Data...
          </div>
        </>
      )}
      
      {errorMessage && (
        <>
          <div className="toast-overlay" onClick={() => setErrorMessage('')} />
          <div className="toast-message error" onClick={() => setErrorMessage('')}>
            {errorMessage}
          </div>
        </>
      )}

      <CompactHeader section={"Weather"} />
      
      <div className="weather-container">
        <div className="main-content">
          {!isRegistered ? (
            <div className="email-registration">
              <h2>🔔 Stay Alert to Weather Changes</h2>
              <p>Get instant notifications for severe weather in your area</p>
              <div className="registration-input-group">
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailRegistration()}
                  placeholder="Enter your email address"
                  className="email-input"
                />
                <button
                  onClick={handleEmailRegistration}
                  className="register-btn"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Registering...' : '✓ Register'}
                </button>
              </div>
              {registrationStatus && (
                <div className={`registration-status ${isRegistered ? 'success' : 'error'}`}>
                  {registrationStatus}
                </div>
              )}
            </div>
          ) : (
            <div className="registration-success">
              <div className="success-header">
                <span className="success-icon">✅</span>
                <div>
                  <h3>Alerts Enabled</h3>
                  <p>{userEmail}</p>
                </div>
              </div>
              {registrationStatus && <p className="status-message">{registrationStatus}</p>}
              <div className="manual-check-section">
                <button
                  onClick={() => checkForRainAlert(weatherData)}
                  className="check-weather-btn"
                  disabled={isLoading}
                >
                  🔍 Check Weather Now
                </button>
              </div>
            </div>
          )}

          <WeatherAlertsSection alerts={weatherAlerts} isLoading={alertsLoading} />

          <div className="search-bar">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyPress={handleSearch}
              placeholder="Search for cities..."
              className="city-search"
            />
            <button onClick={handleSearchClick} className="search-btn" disabled={isLoading}>
              🔍 Search
            </button>
            <button onClick={getCurrentLocation} className="location-btn" disabled={isLoading}>
              📍 My Location
            </button>
          </div>

          {weatherData.cityName && (
            <>
              <div className="weather-main">
                <div className="city-info">
                  <h1>{weatherData.cityName}</h1>
                  <p className="weather-description">{weatherData.description}</p>
                </div>
                <div className="current-temp">
                  <span className="temperature">{weatherData.temperature}</span>
                  <div className="weather-icon">{weatherData.icon}</div>
                </div>
              </div>

              {hourlyForecast.length > 0 && (
                <div className="hourly-forecast">
                  <h3>⏰ TODAY'S HOURLY FORECAST</h3>
                  <div className="hourly-container">
                    {hourlyForecast.map((item, index) => (
                      <div key={index} className="hourly-item" title={item.description}>
                        <div className="hourly-time">{item.time}</div>
                        <div className="hourly-icon">{item.icon}</div>
                        <div className="hourly-temp">{item.temp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="air-conditions">
                <div className="conditions-header">
                  <h3>🌍 AIR CONDITIONS</h3>
                  <button className="see-more">More →</button>
                </div>
                <div className="conditions-grid">
                  <div className="condition-item">
                    <div className="condition-icon">🌡️</div>
                    <div className="condition-info">
                      <span className="condition-label">Feels Like</span>
                      <span className="condition-value">{weatherData.feelsLike}</span>
                    </div>
                  </div>
                  <div className="condition-item">
                    <div className="condition-icon">💨</div>
                    <div className="condition-info">
                      <span className="condition-label">Wind Speed</span>
                      <span className="condition-value">{weatherData.windSpeed}</span>
                    </div>
                  </div>
                  <div className="condition-item">
                    <div className="condition-icon">💧</div>
                    <div className="condition-info">
                      <span className="condition-label">Humidity</span>
                      <span className="condition-value">{weatherData.humidity}</span>
                    </div>
                  </div>
                  <div className="condition-item">
                    <div className="condition-icon">🌧️</div>
                    <div className="condition-info">
                      <span className="condition-label">Rain Chance</span>
                      <span className="condition-value">{weatherData.rainChance}</span>
                    </div>
                  </div>
                  <div className="condition-item">
                    <div className="condition-icon">🔽</div>
                    <div className="condition-info">
                      <span className="condition-label">Pressure</span>
                      <span className="condition-value">{weatherData.pressure}</span>
                    </div>
                  </div>
                  <div className="condition-item">
                    <div className="condition-icon">☀️</div>
                    <div className="condition-info">
                      <span className="condition-label">UV Index</span>
                      <span className="condition-value">{weatherData.uvIndex}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {dailyForecast.length > 0 && (
          <div className="forecast-sidebar">
            <h3>📅 7-DAY FORECAST</h3>
            <div className="daily-forecast">
              {dailyForecast.map((item, index) => (
                <div key={index} className="daily-item">
                  <div className="daily-left">
                    <div className="daily-day">{item.day}</div>
                    <div className="daily-icon">{item.icon}</div>
                    <div className="daily-desc">{item.desc}</div>
                  </div>
                  <div className="daily-temps">
                    <span className="daily-high">{item.high}°</span>
                    <span className="daily-low">/{item.low}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;