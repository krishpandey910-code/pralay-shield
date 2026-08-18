import { useState } from 'react';
import Header from './../../components/Header';
import Dashboard from '../../components/Civilians/Dashboard';

const NDMA_CONTENT = {
  title: 'NDMA PORTAL',
  subtitle: "India's Official Platform for Disaster Management",
  descriptions: [
    'Managed by the National Disaster Management Authority, this portal empowers citizens, agencies, and state authorities with real-time updates, resources, and support during emergencies.',
    'From early warnings and relief coordination to recovery efforts, we ensure rapid response and unified action across the nation.'
  ],
  highlight: "Together with you, we strengthen India's resilience against disasters—saving lives and restoring communities.",
  whyTitle: 'Why Disaster Management?',
  whyContent: [
    'India is one of the most disaster prone countries in the world, 23 out of 28 states are multi-disaster prone regions. Every year millions of Indians are affected by natural disasters. These disasters leave people traumatized by the death of family and friends, with lives devastated by loss of livelihood.',
    'To deal with disasters effectively, there is an urgent need for local institutions that can play a pro-active role in disaster management. This resulted in the establishment of rapid response initiatives dedicated to providing disaster response and preparedness activities across India.'
  ]
};

const styles = {
  homePage: {
    width: '100%',
    minHeight: '100vh',
    background: '#f8f9fa',
    overflowX: 'hidden',
    fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  },
  ndmaSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  ndmaSectionBefore: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    opacity: 0.3
  },
  ndmaContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  },
  title: {
    fontSize: '54px',
    fontWeight: '800',
    marginBottom: '16px',
    letterSpacing: '2px',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    animation: 'fadeInDown 0.8s ease-out',
    margin: 0,
    paddingBottom: '16px'
  },
  subtitle: {
    fontSize: '28px',
    fontWeight: '500',
    marginBottom: '20px',
    opacity: 0.95,
    animation: 'fadeInDown 0.8s ease-out 0.2s both'
  },
  divider: {
    width: '100px',
    height: '4px',
    background: 'white',
    border: 'none',
    borderRadius: '2px',
    margin: '24px auto 32px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  dividerLight: {
    background: 'rgba(255, 255, 255, 0.8)'
  },
  contentWrapper: {
    animation: 'fadeInUp 0.8s ease-out 0.4s both'
  },
  description: {
    fontSize: '16px',
    lineHeight: 1.8,
    marginBottom: '18px',
    opacity: 0.9,
    letterSpacing: '0.3px'
  },
  highlight: {
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '32px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.15)',
    borderLeft: '5px solid #FFD700',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    animation: 'slideInLeft 0.8s ease-out 0.6s both'
  },
  whyDisasterSection: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: 'white',
    padding: '80px 20px',
    position: 'relative',
    overflow: 'hidden'
  },
  whyContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  },
  whyTitle: {
    fontSize: '42px',
    fontWeight: '800',
    marginBottom: '16px',
    letterSpacing: '1px',
    animation: 'fadeInDown 0.8s ease-out',
    margin: 0,
    paddingBottom: '16px'
  },
  whyContent: {
    animation: 'fadeInUp 0.8s ease-out 0.2s both'
  },
  whyPara: {
    fontSize: '16px',
    lineHeight: 1.9,
    marginBottom: '24px',
    opacity: 0.9,
    textAlign: 'justify',
    letterSpacing: '0.4px',
    transition: 'all 0.3s ease'
  }
};

const Home = () => {
  return (
    <div style={styles.homePage}>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .why-para-hover {
          opacity: 1;
          transform: translateX(8px);
        }
        @media (max-width: 768px) {
          .home-title {
            font-size: 36px;
            letter-spacing: 1px;
          }
          .home-subtitle {
            font-size: 20px;
          }
          .home-description {
            font-size: 15px;
            line-height: 1.7;
          }
          .home-highlight {
            font-size: 16px;
            padding: 16px;
          }
          .why-title {
            font-size: 32px;
          }
          .why-para {
            font-size: 14px;
            text-align: left;
          }
          .ndma-section,
          .why-disaster-section {
            padding: 50px 20px;
          }
        }
        @media (max-width: 480px) {
          .home-title {
            font-size: 28px;
          }
          .home-subtitle {
            font-size: 16px;
          }
          .home-description {
            font-size: 14px;
          }
          .home-highlight {
            font-size: 14px;
            border-left-width: 4px;
          }
          .why-title {
            font-size: 24px;
          }
          .why-para {
            font-size: 13px;
          }
          .ndma-section,
          .why-disaster-section {
            padding: 40px 16px;
          }
          .divider {
            width: 80px;
          }
        }
      `}</style>

      <Header section="Home" />
      <section style={styles.ndmaSection}>
        <div style={styles.ndmaContainer}>
          <h1 style={styles.title} className="home-title">{NDMA_CONTENT.title}</h1>
          <h2 style={styles.subtitle} className="home-subtitle">{NDMA_CONTENT.subtitle}</h2>
          <hr style={styles.divider} />
          
          <div style={styles.contentWrapper}>
            {NDMA_CONTENT.descriptions.map((desc, index) => (
              <p key={index} style={styles.description} className="home-description">{desc}</p>
            ))}
            <p style={styles.highlight} className="home-highlight">{NDMA_CONTENT.highlight}</p>
          </div>
        </div>
      </section>

      {/* Why Disaster Section */}
      <section style={styles.whyDisasterSection}>
        <div style={styles.whyContainer}>
          <h2 style={styles.whyTitle} className="why-title">{NDMA_CONTENT.whyTitle}</h2>
          <hr style={{ ...styles.divider, ...styles.dividerLight }} />
          
          <div style={styles.whyContent}>
            {NDMA_CONTENT.whyContent.map((para, index) => (
              <p
                key={index}
                style={styles.whyPara}
                className="why-para"
                onMouseEnter={(e) => e.target.classList.add('why-para-hover')}
                onMouseLeave={(e) => e.target.classList.remove('why-para-hover')}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      <Dashboard />
    </div>
  );
};

export default Home;