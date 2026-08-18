import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_KEY = '210d5062b95c6d926279c92dbf27770b';
const ALERTS_URL = 'https://api.openweathermap.org/data/2.5/onecall';

const COLORS = ['#667eea', '#ED0707', '#F59E0B', '#10B981', '#8B5CF6'];
const SEVERITY_COLORS = {
  CRITICAL: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#10B981',
  LOW: '#3B82F6'
};

const DISASTER_TYPE_ICONS = {
  EARTHQUAKE: '⛰️',
  FLOOD: '🌊',
  WILDFIRE: '🔥',
  HURRICANE: '🌀',
  TORNADO: '🌪️',
  LANDSLIDE: '🪨',
  OTHER: '⚠️'
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_reports: 0,
    total_users: 0,
    active_sos_alerts: 0,
    total_safe_houses: 0,
    total_volunteers: 0,
    active_weather_alerts: 0
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [disasterTypeData, setDisasterTypeData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);

  // Real-time Safe House data
  const [liveSafeHouseCount, setLiveSafeHouseCount] = useState(0);
  const [locationError, setLocationError] = useState(null);

  // NEW: Real-time Weather Alerts
  const [liveWeatherAlerts, setLiveWeatherAlerts] = useState(0);
  const [weatherAlertsLoading, setWeatherAlertsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // --- Data computation helpers ---
  const computeDisasterTypeData = (reports) => {
    const typeCounts = {};
    reports.forEach(r => {
      const type = r.disaster_type || 'OTHER';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value
    }));
  };

  const computeSeverityData = (reports) => {
    const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    reports.forEach(r => {
      const sev = r.severity?.toUpperCase();
      if (severityCounts.hasOwnProperty(sev)) severityCounts[sev]++;
    });
    return Object.entries(severityCounts).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      color: SEVERITY_COLORS[name]
    }));
  };

  const computeTimelineData = (reports) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const counts = new Array(7).fill(0);
    reports.forEach(r => {
      if (r.created_at) {
        const reportDate = new Date(r.created_at);
        const daysDiff = Math.floor((new Date() - reportDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) counts[6 - daysDiff]++;
      }
    });
    return last7Days.map((day, idx) => ({ date: day, reports: counts[idx] }));
  };

  // --- NEW: Fetch Weather Alerts ---
  const fetchWeatherAlerts = async (lat, lon) => {
    setWeatherAlertsLoading(true);
    try {
      const response = await fetch(
        `${ALERTS_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,current&appid=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.alerts && data.alerts.length > 0) {
        setLiveWeatherAlerts(data.alerts.length);
      } else {
        setLiveWeatherAlerts(0);
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      setLiveWeatherAlerts(0);
    } finally {
      setWeatherAlertsLoading(false);
    }
  };

  // --- Fetch dashboard data ---
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`${BASE_URL}/statistics`),
        fetch(`${BASE_URL}/disaster-reports?limit=50`)
      ]);
      if (!statsRes.ok || !reportsRes.ok) throw new Error('Failed to fetch data');
      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      setStats(statsData);
      setRecentReports(reportsData);
      setDisasterTypeData(computeDisasterTypeData(reportsData));
      setSeverityData(computeSeverityData(reportsData));
      setTimelineData(computeTimelineData(reportsData));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch nearby Safe Houses ---
  const fetchSafeHousesNearby = async (lat, lon) => {
    const query = `[out:json];
      (
        node["amenity"="school"](around:5000,${lat},${lon});
        node["amenity"="hospital"](around:5000,${lat},${lon});
        node["amenity"="police"](around:5000,${lat},${lon});
      );
      out;`;

    const servers = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter"
    ];

    for (const server of servers) {
      try {
        const res = await fetch(`${server}?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.elements.length > 0) {
          setLiveSafeHouseCount(data.elements.length);
          return;
        }
      } catch (err) {
        console.warn(`Overpass error on ${server}`, err);
      }
    }
    setLocationError("⚠️ Could not fetch safe houses nearby");
  };

  // --- Get user location and fetch both Safe Houses and Weather Alerts ---
  const getUserLocationAndFetchData = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCurrentLocation({ lat, lon });
          fetchSafeHousesNearby(lat, lon);
          fetchWeatherAlerts(lat, lon);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocationError("Location access denied");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationError("Geolocation not supported");
    }
  };

  // --- Check if weather alerts are available from the Weather page ---
  useEffect(() => {
    // Try to get alerts from window object (if Weather page has set it)
    const checkWindowAlerts = () => {
      if (typeof window.getWeatherAlertCount === 'function') {
        const count = window.getWeatherAlertCount();
        if (count !== undefined) {
          setLiveWeatherAlerts(count);
        }
      }
    };

    checkWindowAlerts();
    const intervalId = setInterval(checkWindowAlerts, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    getUserLocationAndFetchData();
    
    const interval = setInterval(() => {
      fetchDashboardData();
      getUserLocationAndFetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    fetchDashboardData();
    getUserLocationAndFetchData();
  };

  const styles = {
    container: { 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
      padding: '40px 20px', 
      minHeight: '100vh' 
    },
    content: { maxWidth: '1400px', margin: '0 auto' },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '40px', 
      background: 'white', 
      padding: '30px', 
      borderRadius: '16px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)' 
    },
    statsGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '20px', 
      marginBottom: '40px' 
    },
    statCard: { 
      background: 'white', 
      padding: '24px', 
      borderRadius: '12px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    chartGrid: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '20px', 
      marginBottom: '40px' 
    },
    chartCard: { 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
      padding: '20px' 
    },
    alertBadge: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: '#EF4444',
      color: 'white',
      fontSize: '10px',
      fontWeight: '700',
      padding: '4px 8px',
      borderRadius: '12px',
      animation: 'pulse 2s ease-in-out infinite'
    },
    loadingDot: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#667eea',
      marginLeft: '8px',
      animation: 'bounce 1.4s ease-in-out infinite'
    }
  };

  if (loading && !stats.total_reports && recentReports.length === 0)
    return (
      <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={48} className="spin" style={{ marginBottom: 20, color: '#667eea' }} />
          <h2>Loading Dashboard...</h2>
          <p>Fetching real-time data...</p>
        </div>
      </div>
    );

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { 
          from {transform:rotate(0)} 
          to {transform:rotate(360deg)} 
        }
        .spin { 
          animation: spin 1s linear infinite; 
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle /> Disaster Management Dashboard
          </h1>
          <button
            onClick={refreshData}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          {[
            { 
              icon: '📋', 
              label: 'Total Reports', 
              value: stats.total_reports, 
              color: '#667eea' 
            },
            { 
              icon: '🆘', 
              label: 'Active SOS', 
              value: stats.active_sos_alerts, 
              color: '#ED0707',
              showAlert: stats.active_sos_alerts > 0 
            },
            {
              icon: '🏠',
              label: 'Safe Houses (Nearby)',
              value: liveSafeHouseCount || stats.total_safe_houses,
              color: '#10B981',
              subtext: liveSafeHouseCount > 0 ? 'Within 5km radius' : null
            },
            { 
              icon: '🌦️', 
              label: 'Weather Alerts', 
              value: weatherAlertsLoading ? '...' : liveWeatherAlerts,
              color: '#3B82F6',
              showAlert: liveWeatherAlerts > 0,
              loading: weatherAlertsLoading,
              subtext: liveWeatherAlerts > 0 ? 'Active in your area' : 'No active alerts'
            }
          ].map((stat, idx) => (
            <div 
              key={idx} 
              style={styles.statCard}
              className="stat-card"
            >
              {stat.showAlert && (
                <div style={styles.alertBadge}>
                  ACTIVE
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '500' }}>
                    {stat.label}
                  </p>
                  <p style={{ 
                    fontSize: 32, 
                    fontWeight: '800', 
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {stat.value}
                    {stat.loading && <span style={styles.loadingDot}></span>}
                  </p>
                  {stat.subtext && (
                    <p style={{ 
                      fontSize: 11, 
                      color: liveWeatherAlerts > 0 ? '#EF4444' : '#10B981', 
                      marginTop: 6,
                      fontWeight: '600'
                    }}>
                      {stat.subtext}
                    </p>
                  )}
                </div>
                <div style={{
                  width: 56, 
                  height: 56, 
                  borderRadius: 12,
                  background: `${stat.color}20`, 
                  color: stat.color,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 24
                }}>
                  {stat.icon}
                </div>
              </div>
              {stat.label.includes('Safe Houses') && locationError && (
                <p style={{ fontSize: 10, color: '#EF4444', marginTop: 6, fontWeight: '500' }}>
                  {locationError}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div style={styles.chartGrid}>
          {/* Disaster Type Pie */}
          <div style={styles.chartCard}>
            <h3 style={{ fontWeight: '600', marginBottom: 10, color: '#1f2937' }}>
              Reports by Type
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={disasterTypeData} dataKey="value" nameKey="name" label>
                  {disasterTypeData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Bar */}
          <div style={styles.chartCard}>
            <h3 style={{ fontWeight: '600', marginBottom: 10, color: '#1f2937' }}>
              Reports by Severity
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline Line Chart */}
          <div style={styles.chartCard}>
            <h3 style={{ fontWeight: '600', marginBottom: 10, color: '#1f2937' }}>
              Reports in Last 7 Days
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reports" stroke="#667eea" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p style={{ 
          textAlign: 'right', 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#666',
          fontWeight: '500'
        }}>
          Last Updated: {lastUpdated.toLocaleTimeString()}
          {currentLocation && (
            <span style={{ marginLeft: '10px', color: '#10B981' }}>
              📍 Location: {currentLocation.lat.toFixed(2)}°, {currentLocation.lon.toFixed(2)}°
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;