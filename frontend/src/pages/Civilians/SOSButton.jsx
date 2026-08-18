import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';
const BASE_URL = import.meta.env.VITE_API_URL;

const SOSButton = ({ lastReport }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const countdownRef = useRef(null);

  const onSOSActivate = async (data = {}) => {
    try {
      const submitData = new FormData();

      submitData.append('reporter', lastReport?.reporter || 'Anonymous');
      submitData.append('text', lastReport?.message || 'Emergency alert - No prior report.');
      submitData.append('latitude', data?.latitude || currentLocation?.latitude || '');
      submitData.append('longitude', data?.longitude || currentLocation?.longitude || '');
      submitData.append('severity', 'critical');
      submitData.append('isSOSAlert', true);
      submitData.append('timestamp', new Date().toISOString());

      const response = await fetch(`${BASE_URL}/sos`, { method: "POST", body: submitData });
      if (!response.ok) throw new Error("Failed to send SOS alert");

      const result = await response.json();
      console.log("SOS Alert sent:", result);
      alert("SOS Alert sent successfully! Emergency responders have been notified.");
    } catch (error) {
      console.error("Error sending SOS:", error);
      alert("Error sending SOS alert. Please try again or contact emergency services directly.");
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          }),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      } else reject(new Error('Geolocation not supported'));
    });
  };

  const handleSOSClick = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.warn('Could not get current location:', error);
      if (lastReport?.latitude && lastReport?.longitude) {
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
      message: `EMERGENCY SOS ALERT - Immediate assistance needed! ${lastReport?.message || 'Emergency situation reported.'}`,
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
    if (/Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent)) {
      window.location.href = `tel:${phoneNumber}`;
    } else if (confirm(`Call ${serviceName} at ${phoneNumber}?`)) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <>
      <div className="sos-button-container">
        <button 
          className="sos-button active" 
          onClick={handleSOSClick}
          disabled={showConfirmation}
        >
          <AlertTriangle className="sos-icon" />
          <span className="sos-text">SOS</span>
          <span className="sos-subtext">Emergency</span>
        </button>
      </div>

      {showConfirmation && (
        <div className="sos-confirmation-overlay">
          <div className="sos-confirmation-modal">
            <div className="sos-confirmation-header">
              <AlertTriangle className="sos-confirmation-icon" />
              <h2 className="sos-confirmation-title">Emergency SOS Alert</h2>
            </div>

            <div className="sos-confirmation-content">
              <p>
                Are you sure you want to send an emergency SOS alert? This will immediately notify emergency responders.
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
                    <p>Lat: {currentLocation.latitude?.toFixed(6)}</p>
                    <p>Lng: {currentLocation.longitude?.toFixed(6)}</p>
                    {currentLocation.accuracy && <p>Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>}
                    {currentLocation.fromLastReport && <p>Using last reported location</p>}
                  </div>
                </div>
              )}

              <div className="emergency-contacts">
                <h4>In immediate danger? Call directly:</h4>
                <div className="emergency-numbers">
                  {[
                    ['911', 'Emergency Services'],
                    ['108', 'Ambulance (India)'],
                    ['100', 'Police'],
                    ['101', 'Fire Department'],
                    ['112', 'Emergency (EU)'],
                    ['999', 'Emergency (UK)']
                  ].map(([num, name]) => (
                    <button key={num} className="emergency-call" onClick={() => handlePhoneCall(num, name)}>
                      <Phone className="phone-icon" /> {num} - {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sos-confirmation-actions">
              <button className="sos-confirm-btn" onClick={confirmSOS}>
                <AlertTriangle className="btn-icon" /> Send SOS Now
              </button>
              <button className="sos-cancel-btn" onClick={cancelSOS}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;