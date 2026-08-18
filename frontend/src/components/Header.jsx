import logo from './../assets/Disaster-Relief.jpeg';
import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Header = ({ section }) => {
  const [curTab, setCurTab] = useState(section ?? "Home");
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    city: '',
    address: ''
  });

  // Crisis and disaster relief themed backgrounds
  const homeBackgrounds = [
    "https://images.pexels.com/photos/763398/pexels-photo-763398.jpeg",
    "https://images.pexels.com/photos/8942728/pexels-photo-8942728.jpeg",
    "https://images.pexels.com/photos/16105713/pexels-photo-16105713.jpeg",
    "https://images.pexels.com/photos/9823013/pexels-photo-9823013.jpeg",
    "https://images.pexels.com/photos/15545136/pexels-photo-15545136.jpeg"
  ];

  const TABS = ["Home", "Weather", "SOS", "SafeHouses", "Social"];

  // Check authentication status on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userData && token) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount(prev => (prev + 1) % homeBackgrounds.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [homeBackgrounds.length]);

  const handleErrorClose = () => {
    if (error !== "Logging Out...") setError(null);
  };

  const handleTabClick = (tab) => {
    if (!isAuthenticated && tab !== "Home") {
      setError("Please login to access this feature");
      setShowAuthModal(true);
      return;
    }
    setCurTab(tab);
    const path = tab === "Home" ? "/user" : `/user/${tab}`;
    window.location.href = path;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Since your backend doesn't have a login endpoint yet, we'll create a basic auth
      // In production, you'd call a real authentication endpoint
      const response = await fetch(`${BACKEND_URL}/users`, {
        method: 'GET'
      });

      if (response.ok) {
        const users = await response.json();
        const foundUser = users.find(u => u.email === formData.email);

        if (foundUser) {
          // Store user data
          localStorage.setItem('user', JSON.stringify(foundUser));
          localStorage.setItem('token', 'temp-token-' + foundUser.id);
          setUser(foundUser);
          setIsAuthenticated(true);
          setShowAuthModal(false);
          setError("Login successful! Welcome back.");
          setTimeout(() => setError(null), 3000);
        } else {
          setError("Invalid email or password");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.fullName,
          password: formData.password,
          phone: formData.phone || null,
          city: formData.city || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', 'temp-token-' + data.id);
        setUser(data);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setError("Registration successful! Welcome to Disaster Relief.");
        setTimeout(() => setError(null), 3000);
      } else {
        setError(data.detail || "Registration failed. Email might already be registered.");
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setError("Logged out successfully");
    setTimeout(() => {
      setError(null);
      window.location.href = "/user";
    }, 1500);
  };

  const isHeroTab = curTab === "Home" || curTab === "Social";
  const backgroundImage = curTab === "Home"
    ? homeBackgrounds[count]
    : "https://images.unsplash.com/photo-1552664730-d307ca884978?fit=crop&w=1500&q=80";

  const styles = {
    container: {
      width: '100%',
      position: 'relative'
    },
    toastOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
      cursor: 'pointer'
    },
    toastMessage: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 24px',
      borderRadius: '12px',
      zIndex: 1000,
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      cursor: 'pointer',
      backgroundColor: error?.includes('success') ? '#10B981' : '#ED0707',
      color: 'white'
    },
    heroSection: {
      position: 'relative',
      width: '100%',
      minHeight: '650px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden'
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: 0
    },
    header: {
      position: 'relative',
      zIndex: 10,
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    },
    logo: {
      height: '60px',
      width: 'auto',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    navbar: {
      display: 'flex',
      gap: '30px',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    navLink: {
      color: 'white',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500',
      padding: '10px 16px',
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
    },
    userSection: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    userIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#ED0707',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '20px',
      color: 'white',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    userName: {
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    logoutBtn: {
      padding: '8px 16px',
      backgroundColor: '#DC2626',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '40px',
      width: '90%',
      maxWidth: '450px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      position: 'relative'
    },
    modalClose: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: 'none',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      color: '#666',
      lineHeight: '1'
    },
    modalTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#1F2937'
    },
    modalSubtitle: {
      fontSize: '14px',
      color: '#6B7280',
      marginBottom: '30px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box'
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      backgroundColor: '#ED0707',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginTop: '10px'
    },
    switchMode: {
      textAlign: 'center',
      marginTop: '20px',
      fontSize: '14px',
      color: '#6B7280'
    },
    switchLink: {
      color: '#ED0707',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    heroContent: {
      position: 'relative',
      zIndex: 5,
      textAlign: 'center',
      color: 'white',
      paddingBottom: '80px',
      animation: 'fadeInUp 0.8s ease-out'
    },
    sloganMain: {
      fontSize: '72px',
      fontWeight: 'bold',
      margin: '40px 0 20px 0',
      lineHeight: '1.2',
      textShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
      letterSpacing: '0.5px'
    },
    sloganHighlight: {
      fontSize: '72px',
      fontWeight: 'bold',
      color: '#FFD700',
      margin: '0 0 40px 0',
      lineHeight: '1',
      textShadow: '0 4px 8px rgba(255, 215, 0, 0.4)',
      letterSpacing: '0.5px'
    },
    sloganSubtitle: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      fontSize: '18px',
      margin: '15px 36px 0 36px',
      lineHeight: '1.6',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      fontWeight: '400'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        nav a:hover {
          transform: translateY(-2px);
        }
        .user-icon:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(237, 7, 7, 0.4);
        }
        .logout-btn:hover {
          background-color: #B91C1C;
        }
        .submit-btn:hover:not(:disabled) {
          background-color: #C10606;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(237, 7, 7, 0.4);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        input:focus {
          border-color: #ED0707;
          box-shadow: 0 0 0 3px rgba(237, 7, 7, 0.1);
        }
      `}</style>

      {error && (
        <>
          <div style={styles.toastOverlay} onClick={handleErrorClose} />
          <div style={styles.toastMessage} onClick={handleErrorClose}>
            {error}
          </div>
        </>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAuthModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowAuthModal(false)}>×</button>
            
            <h2 style={styles.modalTitle}>
              {authMode === 'login' ? 'Welcome Back' : 'Join Us'}
            </h2>
            <p style={styles.modalSubtitle}>
              {authMode === 'login' 
                ? 'Sign in to access disaster relief services' 
                : 'Create an account to help and get help'}
            </p>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                style={styles.submitBtn}
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div style={styles.switchMode}>
              {authMode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <span 
                    style={styles.switchLink}
                    onClick={() => setAuthMode('register')}
                  >
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span 
                    style={styles.switchLink}
                    onClick={() => setAuthMode('login')}
                  >
                    Sign in
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.heroSection}>
        {isHeroTab && (
          <img
            style={styles.backgroundImage}
            src={backgroundImage}
            alt="Hero Background"
          />
        )}

        <div style={styles.header}>
          <img style={styles.logo} src={logo} alt="App Logo" />
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

            {/* User Section */}
            <div style={styles.userSection}>
              {isAuthenticated && user ? (
                <>
                  <span style={styles.userName}>{user.full_name || user.email}</span>
                  <div style={styles.userIcon} className="user-icon">
                    👤
                  </div>
                  <button 
                    style={styles.logoutBtn}
                    className="logout-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div 
                  style={styles.userIcon}
                  className="user-icon"
                  onClick={() => setShowAuthModal(true)}
                  title="Login / Register"
                >
                  👤
                </div>
              )}
            </div>
          </div>
        </div>

        {curTab === "Home" && (
          <div style={styles.heroContent}>
            <p style={styles.sloganMain}>Hope Rises When We Unite</p>
            <p style={styles.sloganHighlight}>IN CRISIS WE STAND STRONG</p>
            <p style={styles.sloganSubtitle}>Every moment counts. Every hand matters. Every voice echoes.</p>
            <p style={styles.sloganSubtitle}>Be the change—respond, help, rebuild. Together we overcome.</p>
          </div>
        )}

        {curTab === "Social" && (
          <div style={styles.heroContent}>
            <p style={styles.sloganMain}>Build Bonds, Save Lives</p>
            <p style={styles.sloganHighlight}>COMMUNITY IS OUR STRENGTH</p>
            <p style={styles.sloganSubtitle}>Connect with neighbors, volunteers, and leaders who share your mission.</p>
            <p style={styles.sloganSubtitle}>Share resources, coordinate action, inspire hope in times of need.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;