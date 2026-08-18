import { useState } from "react";
import Header from "../../components/Header";
import './CSS/Social.css';

function Social() {
  const [volunteerData, setVolunteerData] = useState({
    email: '',
    full_name: '',
    phone: '',
    city: '',
    skills: '',
    availability: '',
    experience_level: 'beginner'
  });
  
  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    success: false,
    error: null
  });

  const openLink = (url) => window.open(url, "_blank");

  const handleVolunteerChange = (e) => {
    const { name, value } = e.target;
    setVolunteerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ loading: true, success: false, error: null });

    try {
      const response = await fetch('http://localhost:8000/api/volunteers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(volunteerData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          loading: false,
          success: true,
          error: null
        });
        
        // Reset form
        setVolunteerData({
          email: '',
          full_name: '',
          phone: '',
          city: '',
          skills: '',
          availability: '',
          experience_level: 'beginner'
        });

        // Show success message
        alert(`Thank you for volunteering, ${data.full_name}! We'll contact you at ${data.email}`);
      } else {
        throw new Error(data.detail || 'Registration failed');
      }
    } catch (error) {
      setSubmitStatus({
        loading: false,
        success: false,
        error: error.message
      });
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <Header section="Social"/>

      {/* Stats Section */}
      <section className="s-stats-section">
        <div className="button-wrapper">
          <button className="btn btn-primary" onClick={() => openLink("https://ndrf.gov.in")}>Get Involved</button>
          <button className="btn btn-secondary" onClick={() => openLink("https://ndrf.gov.in")}>Learn More</button>
        </div>
        <div className="s-container">
          <div className="s-stats-grid">
            {[
              { icon: "fa-users", target: 5000, label: "Lives Saved" },
              { icon: "fa-hands-helping", target: 250, label: "Volunteers" },
              { icon: "fa-globe", target: 50, label: "Countries Served" },
              { icon: "fa-clock", target: 24, label: "24/7 Response" },
            ].map((stat, index) => (
              <div key={index} className="s-stat-card">
                <div className="s-stat-icon">
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <div className="s-stat-number" data-target={stat.target}>
                  {stat.target}
                </div>
                <div className="s-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <h2 className="section-title">How We Help</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-ambulance"></i></div>
              <h3>Emergency Response</h3>
              <p>Rapid deployment of rescue teams and medical aid during disasters and emergencies.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-graduation-cap"></i></div>
              <h3>Training Programs</h3>
              <p>Comprehensive training for volunteers and communities in disaster preparedness and response.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-home"></i></div>
              <h3>Recovery Support</h3>
              <p>Long-term assistance in rebuilding communities and restoring normalcy after disasters.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><i className="fas fa-shield-alt"></i></div>
              <h3>Prevention & Planning</h3>
              <p>Proactive disaster risk reduction and community preparedness planning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Registration Section */}
      <section className="volunteer-section">
        <div className="container">
          <div className="volunteer-content">
            <h2>Become a Volunteer</h2>
            <p>Join our team and make a difference in disaster response and community resilience</p>
            
            <form className="volunteer-form" onSubmit={handleVolunteerSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={volunteerData.full_name}
                    onChange={handleVolunteerChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={volunteerData.email}
                    onChange={handleVolunteerChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={volunteerData.phone}
                    onChange={handleVolunteerChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={volunteerData.city}
                    onChange={handleVolunteerChange}
                    placeholder="Your city"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills & Expertise</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={volunteerData.skills}
                  onChange={handleVolunteerChange}
                  placeholder="e.g., First Aid, Search & Rescue, Medical, IT Support"
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability">Availability</label>
                <input
                  type="text"
                  id="availability"
                  name="availability"
                  value={volunteerData.availability}
                  onChange={handleVolunteerChange}
                  placeholder="e.g., Weekends, Emergency response only, Full-time"
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience_level">Experience Level</label>
                <select
                  id="experience_level"
                  name="experience_level"
                  value={volunteerData.experience_level}
                  onChange={handleVolunteerChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="volunteer-submit-btn"
                disabled={submitStatus.loading}
              >
                {submitStatus.loading ? 'Submitting...' : 'Register as Volunteer'}
              </button>

              {submitStatus.success && (
                <div className="success-message">
                  ✅ Registration successful! We'll contact you soon.
                </div>
              )}

              {submitStatus.error && (
                <div className="error-message">
                  ❌ {submitStatus.error}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Get the latest updates on our disaster response activities and volunteer opportunities</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email address" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <i className="fas fa-hand-holding-heart"></i>
                <span>Disaster Management</span>
              </div>
              <p>
                Dedicated to saving lives and building resilient communities through emergency response and disaster preparedness.
              </p>
            </div>

            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Get Involved</h3>
              <ul>
                <li><a href="#volunteer">Volunteer</a></li>
                <li><a href="#donate">Donate</a></li>
                <li><a href="#training">Training</a></li>
                <li><a href="#partnerships">Partnerships</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Contact Info</h3>
              <div className="contact-info">
                <p><i className="fas fa-phone"></i> +1-800-DISASTER</p>
                <p><i className="fas fa-envelope"></i> info@disastercare.org</p>
                <p><i className="fas fa-map-marker-alt"></i> Emergency Response Center</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="social-links">
              <span className="follow-text">Follow us:</span>
              <a href="https://www.instagram.com/ndrfindia/" target="_blank" aria-label="Instagram" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" />
              </a>
              <a href="https://www.facebook.com/HQNDRF" target="_blank" aria-label="Facebook" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" />
              </a>
              <a href="https://x.com/ndrfhq" target="_blank" aria-label="Twitter" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" alt="Twitter" />
              </a>
              <a href="https://www.youtube.com/channel/UCnITGBejfoA1Gzgv_Cshgig" target="_blank" aria-label="YouTube" rel="noreferrer">
                <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" />
              </a>
            </div>
            <p>&copy; 2025. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Inline Styles for Volunteer Section */}
      <style>{`
        /* Volunteer Registration Section */
        .volunteer-section {
          padding: 80px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .volunteer-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .volunteer-content h2 {
          font-size: 2.5rem;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .volunteer-content p {
          font-size: 1.1rem;
          margin-bottom: 40px;
          opacity: 0.95;
        }

        .volunteer-form {
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          text-align: left;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          color: #333;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input::placeholder {
          color: #999;
        }

        .volunteer-submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .volunteer-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .volunteer-submit-btn:active {
          transform: translateY(0);
        }

        .volunteer-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .success-message {
          margin-top: 20px;
          padding: 15px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          color: #155724;
          font-weight: 500;
          text-align: center;
        }

        .error-message {
          margin-top: 20px;
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          color: #721c24;
          font-weight: 500;
          text-align: center;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .volunteer-content h2 {
            font-size: 2rem;
          }

          .volunteer-form {
            padding: 25px;
          }
        }
      `}</style>
    </>
  );
}

export default Social;