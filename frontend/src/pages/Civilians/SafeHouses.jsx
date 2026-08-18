import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "./CSS/SafeHouses.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Update this to your backend URL
const API_BASE_URL = "http://localhost:8000";

// Compact Header Wrapper (keep your existing one)
const CompactHeaderWrapper = () => {
  const [curTab, setCurTab] = useState("SafeHouses");
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
      padding: '8px 40px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderBottom: '2px solid #ED0707',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    logo: {
      height: '32px',
      width: 'auto',
      borderRadius: '6px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center'
    },
    navbar: {
      display: 'flex',
      gap: '18px',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    navLink: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '12px',
      fontWeight: '600',
      padding: '5px 10px',
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
      
      <img style={styles.logo} src="/src/assets/Disaster-Relief.jpeg" alt="App Logo" />
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

const SafeHouses = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const routeControlRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      
      if (data.length > 0) {
        const newLoc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setUserLocation(newLoc);
        mapRef.current.setView([newLoc.lat, newLoc.lng], 14);
        
        // Clear previous markers
        markersRef.current.forEach(m => mapRef.current.removeLayer(m));
        markersRef.current = [];
        
        // Add marker for searched location
        L.marker([newLoc.lat, newLoc.lng])
          .addTo(mapRef.current)
          .bindPopup(`📍 ${searchQuery}`)
          .openPopup();
        
        // Fetch shelters for new location
        await fetchSheltersFromBackend(newLoc.lat, newLoc.lng);
      } else {
        setError("Location not found. Try a different search.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch location. Try again.");
    }
  };

  // Shelter icon
  const shelterIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/4117/4117166.png",
    iconSize: [32, 32],
  });

  // Sync shelters from OSM to backend database
  const syncSheltersToDatabase = async (lat, lon) => {
    setSyncing(true);
    setSyncMessage("Fetching safe houses from OpenStreetMap...");
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/safe-houses/sync?latitude=${lat}&longitude=${lon}&radius=5000`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to sync shelters');
      }
      
      const data = await response.json();
      console.log('Sync result:', data);
      
      if (data.success) {
        setSyncMessage(
          `✅ Synced! Added ${data.saved_count} new, updated ${data.updated_count} existing safe houses`
        );
        
        // Wait a moment to show success message
        setTimeout(() => {
          setSyncMessage("");
          // Fetch the updated list
          fetchSheltersFromBackend(lat, lon);
        }, 3000);
      } else {
        setError(data.message || 'Sync completed but with warnings');
      }
      
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to sync shelters from OpenStreetMap. Please try again.');
      setSyncMessage("");
    } finally {
      setSyncing(false);
    }
  };

  // Fetch shelters from YOUR backend database
  const fetchSheltersFromBackend = async (lat, lon) => {
    setLoading(true);
    setError(null);
    setShelters([]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/safe-houses/nearby?latitude=${lat}&longitude=${lon}&radius=5000&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch shelters from database');
      }
      
      const data = await response.json();
      console.log('Fetched shelters:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch shelters');
      }
      
      if (data.count === 0) {
        setError(
          "No safe houses found in database. Click 'Sync from OpenStreetMap' to fetch and store safe houses."
        );
        setLoading(false);
        return;
      }

      // Transform data for display
      const shelterData = data.safe_houses.map((shelter) => ({
        id: shelter.id,
        name: shelter.name,
        type: shelter.type,
        position: [shelter.latitude, shelter.longitude],
        distance: shelter.distance,
        capacity: shelter.capacity,
        occupancy: shelter.current_occupancy,
        availableSpace: shelter.available_space,
        contact: shelter.contact,
        address: shelter.address,
        facilities: shelter.facilities || ["Emergency Shelter"],
        isAvailable: shelter.is_available
      }));

      setShelters(shelterData);
      addMarkersToMap(shelterData);
      
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load safe houses from database. Try syncing first.');
    } finally {
      setLoading(false);
    }
  };

  // Add markers to map
  const addMarkersToMap = (shelters) => {
    const map = mapRef.current;
    
    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    shelters.forEach((shelter) => {
      const availabilityText = shelter.capacity 
        ? `${shelter.occupancy}/${shelter.capacity} occupied`
        : 'Capacity unknown';
      
      const availabilityColor = shelter.isAvailable ? '🟢' : '🔴';
      
      const popupContent = `
        <div style="min-width: 220px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #ED0707;">🏠 ${shelter.name}</h3>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${shelter.type}</p>
          <p style="margin: 4px 0;"><strong>Distance:</strong> ${shelter.distance} km</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${availabilityColor} ${shelter.isAvailable ? 'Available' : 'Full'}</p>
          ${shelter.capacity ? `<p style="margin: 4px 0;"><strong>Capacity:</strong> ${availabilityText}</p>` : ''}
          ${shelter.availableSpace !== null ? `<p style="margin: 4px 0;"><strong>Space Available:</strong> ${shelter.availableSpace} spots</p>` : ''}
          ${shelter.contact !== 'N/A' ? `<p style="margin: 4px 0;"><strong>Contact:</strong> ${shelter.contact}</p>` : ''}
          ${shelter.address ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${shelter.address}</p>` : ''}
          ${shelter.facilities.length > 0 ? `<p style="margin: 4px 0; font-size: 11px;"><strong>Facilities:</strong> ${shelter.facilities.join(', ')}</p>` : ''}
        </div>
      `;
      
      const marker = L.marker(shelter.position, { icon: shelterIcon })
        .addTo(map)
        .bindPopup(popupContent);
      
      markersRef.current.push(marker);
    });
  };

  // Show route on map
  const showRoute = (lat, lon) => {
    const map = mapRef.current;
    if (!userLocation) {
      alert("User location not available");
      return;
    }

    if (routeControlRef.current) {
      map.removeControl(routeControlRef.current);
    }

    routeControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(lat, lon),
      ],
      routeWhileDragging: false,
      createMarker: () => null,
    }).addTo(map);

    map.setView([lat, lon], 15);
  };

  // Initialize map and get user location
  useEffect(() => {
    if (mapRef.current) return;
    
    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          
          L.marker([loc.lat, loc.lng])
            .addTo(map)
            .bindPopup("📍 You are here")
            .openPopup();
          
          map.setView([loc.lat, loc.lng], 14);
          fetchSheltersFromBackend(loc.lat, loc.lng);
        },
        (err) => {
          setLoading(false);
          setError("Unable to get your location. Please enable location access or use the search.");
          console.error(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setError("Geolocation not supported by your browser");
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <>
      <CompactHeaderWrapper />
      <div className="safe-houses-app" style={{ marginTop: 0, paddingTop: '20px' }}>
        {/* Search Bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search location (e.g., 'Mumbai, India')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">🔍 Search</button>
        </form>

        {/* Header with Sync Button */}
        <div className="map-header">
          <h2>🏠 Safe Houses Near You</h2>
          {userLocation && (
            <div>
              <p>📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
              <button
                onClick={() => syncSheltersToDatabase(userLocation.lat, userLocation.lng)}
                disabled={syncing || loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: syncing ? '#ccc' : '#ED0707',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: syncing || loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                {syncing ? '🔄 Syncing...' : '🔄 Sync from OpenStreetMap'}
              </button>
              {syncMessage && (
                <p style={{ 
                  color: '#28a745', 
                  fontWeight: 'bold', 
                  marginTop: '10px',
                  fontSize: '14px'
                }}>
                  {syncMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Emergency Button */}
        <div 
          className="emergency-button" 
          onClick={() => window.open("tel:112")}
          style={{ cursor: 'pointer' }}
        >
          🚨 EMERGENCY CALL 112
        </div>

        {/* Map */}
        <div 
          ref={mapContainerRef} 
          style={{ height: "60vh", width: "100%", borderRadius: '8px', overflow: 'hidden' }}
        ></div>

        {/* Loading */}
        {loading && <p className="loading">🔍 Finding safe houses near you...</p>}
        {syncing && <p className="loading">🔄 Syncing from OpenStreetMap...</p>}

        {/* Error */}
        {error && (
          <div className="error" style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            margin: '15px 0'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Notice</h3>
            <p>{error}</p>
            {userLocation && (
              <button 
                onClick={() => fetchSheltersFromBackend(userLocation.lat, userLocation.lng)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#ED0707',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Shelters List */}
        {shelters.length > 0 && (
          <div className="shelters-grid" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>
              Found {shelters.length} Safe Houses
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '15px' 
            }}>
              {shelters.map((shelter) => (
                <div 
                  key={shelter.id} 
                  className="shelter-card"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    padding: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: shelter.isAvailable ? '2px solid #28a745' : '2px solid #dc3545'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', color: '#ED0707' }}>
                    {shelter.name}
                  </h3>
                  <p><strong>Type:</strong> {shelter.type}</p>
                  <p><strong>Distance:</strong> {shelter.distance} km away</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span style={{ color: shelter.isAvailable ? '#28a745' : '#dc3545' }}>
                      {shelter.isAvailable ? '✅ Available' : '❌ Full'}
                    </span>
                  </p>
                  {shelter.capacity && (
                    <>
                      <p><strong>Capacity:</strong> {shelter.capacity} people</p>
                      <p><strong>Current:</strong> {shelter.occupancy} people</p>
                      {shelter.availableSpace !== null && (
                        <p><strong>Space Available:</strong> {shelter.availableSpace} spots</p>
                      )}
                    </>
                  )}
                  {shelter.contact !== 'N/A' && (
                    <p><strong>Contact:</strong> {shelter.contact}</p>
                  )}
                  {shelter.facilities.length > 0 && (
                    <p style={{ fontSize: '12px' }}>
                      <strong>Facilities:</strong> {shelter.facilities.join(', ')}
                    </p>
                  )}
                  <button 
                    onClick={() => showRoute(shelter.position[0], shelter.position[1])}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#ED0707',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginTop: '10px'
                    }}
                  >
                    🗺️ Show Route
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SafeHouses;