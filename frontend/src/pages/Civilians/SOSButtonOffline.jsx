import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, Phone, Wifi, WifiOff, Download } from 'lucide-react';
const BASE_URL = import.meta.env.VITE_API_URL;

const SOSButtonOffline = ({ enabled, lastReport }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const countdownRef = useRef(null);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle PWA install prompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });
  }, []);

  const onSOSActivate = async (sosData) => {
    try {
      if (!isOnline) {
        // Store SOS alert for later when online
        await storeOfflineSOS(sosData);
        alert("SOS Alert stored offline. It will be sent automatically when connection is restored.");
        return;
      }

      const submitData = new FormData();
      submitData.append('reporter', lastReport.reporter);
      submitData.append('text', sosData.message || lastReport.message);
      submitData.append('latitude', sosData.currentLocation?.latitude || lastReport.latitude);
      submitData.append('longitude', sosData.currentLocation?.longitude || lastReport.longitude);
      submitData.append('severity', 'critical');
      submitData.append('isSOSAlert', true);
      submitData.append('timestamp', new Date().toISOString());

      const response = await fetch(`${BASE_URL}/sos`, { method: "POST", body: submitData });
      if (!response.ok) { throw new Error("Failed to send SOS alert"); }
      const result = await response.json();
      console.log("SOS Alert sent:", result);
      alert("SOS Alert sent successfully! Emergency responders have been notified.");
    } catch (error) {
      console.error("Error sending SOS:", error);
      
      // If online but failed, store for retry
      if (isOnline) {
        await storeOfflineSOS(sosData);
        alert("SOS Alert failed to send. Stored for retry when connection improves.");
      } else {
        alert("Error sending SOS alert. Please try again or contact emergency services directly.");
      }
    }
  };

  // Store SOS alert offline
  const storeOfflineSOS = async (sosData) => {
    try {
      const offlineAlerts = JSON.parse(localStorage.getItem('offlineSOSAlerts') || '[]');
      const newAlert = {
        id: Date.now().toString(),
        ...sosData,
        timestamp: new Date().toISOString(),
        storedOffline: true
      };
      
      offlineAlerts.push(newAlert);
      localStorage.setItem('offlineSOSAlerts', JSON.stringify(offlineAlerts));
      
      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync-sos');
      }
      
      console.log('SOS alert stored offline:', newAlert);
    } catch (error) {
      console.error('Failed to store offline SOS:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({ 
              latitude: position.coords.latitude, 
              longitude: position.coords.longitude, 
              accuracy: position.coords.accuracy, 
              timestamp: new Date().toISOString() 
            });
          }, (error) => { reject(error); },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      } else { reject(new Error('Geolocation not supported')); }
    });
  };

  const handleSOSClick = async () => {
    if (!enabled) {
      alert('Please submit a disaster report first to enable the SOS function.'); 
      return; 
    }

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.warn('Could not get current location:', error);
      if (lastReport && lastReport.latitude && lastReport.longitude) {
        setCurrentLocation({
          latitude: lastReport.latitude,
          longitude: lastReport.longitude,
          timestamp: new Date().toISOString(),
          fromLastReport: true
        });
      }
    }

    setShowConfirmation(true);
    setCountdown(10);
    setIsAutoSending(true);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          confirmSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmSOS = async () => {
    clearInterval(countdownRef.current);
    setIsAutoSending(false);
    setShowConfirmation(false);

    const sosData = {
      currentLocation,
      autoSent: countdown === 0,
      emergencyType: 'SOS_ALERT',
      message: ` EMERGENCY SOS ALERT - Immediate assistance needed! ${lastReport?.message || 'Emergency situation reported.'}`,
      severity: 'critical'
    };

    await onSOSActivate(sosData);
  };

  const cancelSOS = () => {
    clearInterval(countdownRef.current);
    setCountdown(0);
    setIsAutoSending(false);
    setShowConfirmation(false);
    setCurrentLocation(null);
  };

  const handlePhoneCall = (phoneNumber, serviceName) => {
    if (navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      if (confirm(`Call ${serviceName} at ${phoneNumber}?`)) {
        window.location.href = `tel:${phoneNumber}`;
      }
    }
  };

  // Install PWA
  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const dismissInstall = () => {
    setShowInstallPrompt(false);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  if (!enabled) {
    return (
      <div className="sos-button-container">
        <button className="sos-button disabled" disabled>
          <AlertTriangle className="sos-icon" />
          <span className="sos-text">SOS</span>
          <span className="sos-subtext">Submit report first</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="sos-button-container">
        {/* Online/Offline Status Indicator */}
        <div className="connection-status">
          {isOnline ? (
            <div className="status-online">
              <Wifi className="status-icon" />
              <span>Online</span>
            </div>
          ) : (
            <div className="status-offline">
              <WifiOff className="status-icon" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>

        <button 
          className="sos-button active" 
          onClick={handleSOSClick}
          disabled={showConfirmation}
        >
          <AlertTriangle className="sos-icon" />
          <span className="sos-text">SOS</span>
          <span className="sos-subtext">
            {isOnline ? 'Emergency' : 'Offline Available'}
          </span>
        </button>

        {/* PWA Install Prompt */}
        {showInstallPrompt && (
          <div className="install-prompt">
            <Download className="install-icon" />
            <span>Install App for Offline Access</span>
            <button className="install-btn" onClick={installApp}>Install</button>
            <button className="dismiss-btn" onClick={dismissInstall}>×</button>
          </div>
        )}
      </div>

      {showConfirmation && (
        <div className="sos-confirmation-overlay">
          <div className="sos-confirmation-modal">
            <div className="sos-confirmation-header">
              <AlertTriangle className="sos-confirmation-icon" />
              <h2 className="sos-confirmation-title">Emergency SOS Alert</h2>
              {!isOnline && (
                <div className="offline-warning">
                  <WifiOff className="warning-icon" />
                  <span>Offline Mode - Alert will be sent when online</span>
                </div>
              )}
            </div>

            <div className="sos-confirmation-content">
              <p className="sos-confirmation-message">
                Are you sure you want to send an emergency SOS alert? This will immediately notify emergency responders.
                {!isOnline && " (Currently offline - will be sent when connection is restored)"}
              </p>

              {isAutoSending && (
                <div className="sos-auto-send-warning">
                  <div className="countdown-circle">
                    <div className="countdown-number">{countdown}</div>
                  </div>
                  <p>Auto-sending in {countdown} seconds...</p>
                </div>
              )}

              {currentLocation && (
                <div className="sos-location-info">
                  <MapPin className="location-icon" />
                  <div className="location-details">
                    <p><strong>Current Location:</strong></p>
                    <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
                    <p>Lng: {currentLocation.longitude.toFixed(6)}</p>
                    {currentLocation.accuracy && (
                      <p className="location-accuracy">Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>
                    )}
                    {currentLocation.fromLastReport && (
                      <p className="location-note">Using last reported location</p>
                    )}
                  </div>
                </div>
              )}

              <div className="emergency-contacts">
                <h4>In immediate danger? Call directly:</h4>
                <div className="emergency-numbers">
                  <button 
                    className="emergency-call"
                    onClick={() => handlePhoneCall('911', 'Emergency Services')}
                  >
                    <Phone className="phone-icon" />
                    911 - Emergency
                  </button>
                  <button 
                    className="emergency-call"
                    onClick={() => handlePhoneCall('108', 'Ambulance Services')}
                  >
                    <Phone className="phone-icon" />
                    108 - Ambulance (India)
                  </button>
                  <button 
                    className="emergency-call"
                    onClick={() => handlePhoneCall('100', 'Police')}
                  >
                    <Phone className="phone-icon" />
                    100 - Police
                  </button>
                  <button 
                    className="emergency-call"
                    onClick={() => handlePhoneCall('101', 'Fire Department')}
                  >
                    <Phone className="phone-icon" />
                    101 - Fire Department
                  </button>
                  <button 
                    className="emergency-call"
                    onClick={() => handlePhoneCall('112', 'Emergency (EU)')}
                  >
                    <Phone className="phone-icon" />
                    112 - Emergency (EU)
                  </button>
                  <button 
                    className="emergency-call"
                    onClick={() => handlePhoneCall('999', 'Emergency (UK)')}
                  >
                    <Phone className="phone-icon" />
                    999 - Emergency (UK)
                  </button>
                </div>
                <p className="emergency-note">
                  <strong>Note:</strong> Click any number above to initiate an emergency call. 
                  On mobile devices, this will open your phone app directly.
                  {!isOnline && " Emergency calls work even when offline."}
                </p>
              </div>
            </div>

            <div className="sos-confirmation-actions">
              <button 
                className="sos-confirm-btn"
                onClick={confirmSOS}
              >
                <AlertTriangle className="btn-icon" />
                {isOnline ? 'Send SOS Now' : 'Store SOS (Offline)'}
              </button>
              <button 
                className="sos-cancel-btn"
                onClick={cancelSOS}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButtonOffline;
