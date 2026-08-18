import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, AlertTriangle, User, MessageSquare, Send, X, CheckCircle } from 'lucide-react';
import LocationPicker from '../../components/Civilians/LocationPicker';
import VoiceRecorder from '../../components/Civilians/VoiceRecorder';
const BASE_URL = import.meta.env.VITE_API_URL;

const ReportForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({ reporter: '', message: '', latitude: '', longitude: '', severity: 'medium', disasterType: 'other' });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-close success message after 5 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => { setPhotoPreview(e.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({ ...prev, latitude: position.coords.latitude.toFixed(6), longitude: position.coords.longitude.toFixed(6) }));
        }, () => { alert('Unable to get your location. Please enter coordinates manually.');});
    } else { alert('Geolocation is not supported by this browser.'); }
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  };
  
  const handleVoiceNote = (audioBlob) => {
    setVoiceNote(audioBlob);
  }; 
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('reporter', formData.reporter);
      submitData.append('text', formData.message); 
      submitData.append('latitude', parseFloat(formData.latitude));
      submitData.append('longitude', parseFloat(formData.longitude));
      submitData.append('severity', formData.severity);
      submitData.append('disaster_type', formData.disasterType);
      if (selectedPhoto) { submitData.append('photo', selectedPhoto); }
      if (voiceNote) { submitData.append('voice_note', voiceNote, 'voice_note.webm'); }
      
      const response = await fetch(`${BASE_URL}/report`, { method: "POST", body: submitData, });
      if (!response.ok) { throw new Error("Failed to submit report"); }
      
      const result = await response.json();
      console.log("Report submitted:", result);
      
      // Show success message
      setShowSuccess(true);
      
      // Call parent callback (if provided) - Don't pass data to prevent duplicate modal
      if (onSubmitSuccess && typeof onSubmitSuccess === 'function') {
        // Only call if you want parent to handle additional logic
        // Comment out if parent shows its own success message
        // onSubmitSuccess({
        //   ...formData,
        //   latitude: parseFloat(formData.latitude),
        //   longitude: parseFloat(formData.longitude),
        //   photo: selectedPhoto,
        //   voiceNote: voiceNote,
        //   timestamp: new Date().toISOString()
        // });
      }
      
      // Reset form
      setFormData({ reporter: "", message: "", latitude: "", longitude: "", severity: "medium", disasterType: "other", });
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setVoiceNote(null);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error submitting report. Please try again.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="submit-section">
      {/* Success Message */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '500px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <CheckCircle size={24} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Report Submitted Successfully!
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Your disaster report has been received and will be reviewed by emergency responders.
            </div>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="form-card">
        <div className="form-header">
          <h2 className="form-title">Submit New Disaster Report</h2>
          <p className="form-description">
            Help emergency responders by reporting disasters in your area with photos and detailed information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-section">
            <h3 className="section-title">Reporter Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <User className="label-icon" /> Reporter Name *
                </label>
                <input type="text" name="reporter" value={formData.reporter} onChange={handleInputChange} className="form-input" placeholder="Enter your full name" required />
              </div>
            </div>
          </div>

          {/* Disaster Details */}
          <div className="form-section">
            <h3 className="section-title">Disaster Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <AlertTriangle className="label-icon" /> Disaster Type *
                </label>
                <select name="disasterType" value={formData.disasterType} onChange={handleInputChange} className="form-select" required>
                  <option value="earthquake">Earthquake</option>
                  <option value="flood">Flood</option>
                  <option value="wildfire">Wildfire</option>
                  <option value="hurricane">Hurricane</option>
                  <option value="tornado">Tornado</option>
                  <option value="landslide">Landslide</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"> Severity Level * </label>
                <select name="severity" value={formData.severity} onChange={handleInputChange} className="form-select" required >
                  <option value="low">Low - Minor impact</option>
                  <option value="medium">Medium - Moderate impact</option>
                  <option value="high">High - Significant impact</option>
                  <option value="critical">Critical - Life threatening</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MessageSquare className="label-icon" /> Detailed Message *
              </label>
              <textarea name="message" value={formData.message} onChange={handleInputChange} className="form-textarea" placeholder="Describe the disaster situation, damages, people affected, immediate needs, etc." rows={4} required />
              <div className="character-count"> {formData.message.length}/500 characters </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Voice Message (Optional)</h3>
            <p className="section-description"> Record a voice message if typing is difficult or for additional details </p>
            <VoiceRecorder onVoiceRecorded={handleVoiceNote} />
          </div>

          {/* Location */}
          <div className="form-section">
            <h3 className="section-title">Location Information</h3>
            <div className="location-header">
              <p className="location-description"> Provide the exact location where the disaster is occurring </p>
              <button type="button" onClick={getCurrentLocation} className="location-btn" >
                <MapPin className="btn-icon" /> Use My Location
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <MapPin className="label-icon" /> Latitude *
                </label>
                <input type="number" name="latitude" value={formData.latitude} onChange={handleInputChange} className="form-input" placeholder="e.g., 40.7128" step="any" required />
              </div>
              <div className="form-group">
                <label className="form-label"> Longitude * </label>
                <input type="number" name="longitude" value={formData.longitude} onChange={handleInputChange} className="form-input" placeholder="e.g., -74.0060" step="any" required />
              </div>
            </div>

            {/* Map Preview */}
            {formData.latitude && formData.longitude && (
              <LocationPicker 
                latitude={parseFloat(formData.latitude)}
                longitude={parseFloat(formData.longitude)}
                onLocationSelect={handleLocationSelect}
              />
            )}
          </div>

          {/* Photo Upload */}
          <div className="form-section">
            <h3 className="section-title">Photo Evidence</h3>
            <p className="section-description"> Upload a photo to help emergency responders assess the situation </p>
            <div className="photo-upload-area">
              {!photoPreview ? (
                <div className="upload-placeholder">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="file-input" id="photo-upload"/>
                  <label htmlFor="photo-upload" className="upload-label">
                    <Camera className="upload-icon" />
                    <div className="upload-text">
                      <span className="upload-title">Click to upload photo</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Report" className="preview-image" />
                  <button type="button" onClick={removePhoto} className="remove-photo-btn" > <X className="remove-icon" /> </button>
                </div> )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="submit-btn" >
              {isSubmitting ? ( <> <div className="spinner"></div> Submitting Report... </>
              ) : ( <> <Send className="btn-icon" />  Submit Report </> )} </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ReportForm;