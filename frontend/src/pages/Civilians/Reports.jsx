import { useState } from 'react';
import ReportForm from './ReportForm';
import SOSButton from './SOSButton';
import { CheckCircle } from 'lucide-react';
import './CSS/Reports.css';
import './CSS/ReportForm.css';
import './CSS/SOSButton.css';
import './CSS/SuccessMessage.css';

const BASE_URL = import.meta.env.VITE_API_URL;

// Compact Header Wrapper
const CompactHeaderWrapper = () => {
  const [curTab, setCurTab] = useState("SOS");
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

const Reports = () => {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState(null);

  const handleReportSubmitSuccess = (reportData) => {
    setLastSubmittedReport(reportData);
    setSubmitSuccess(true);
  };

  return (
    <>
      <CompactHeaderWrapper />
      <div className="reports-content" style={{ marginTop: 0, paddingTop: '20px' }}>
        <div className="reports-header">
          <h1 className="reports-title">Disaster Reports</h1>
          <p className="reports-subtitle">Submit and track disaster reports in your area</p>
          <center>
            <div className='Emg-Buttons' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', margin: '0', width: '100%', maxWidth: '350px' }}>
              <SOSButton lastReport={lastSubmittedReport} />
              <div className="emergency-button" onClick={() => window.open("tel:112")}> EMERGENCY CALL 112 </div>
            </div>
          </center>
        </div>
        <ReportForm onSubmitSuccess={handleReportSubmitSuccess} />
        {submitSuccess && (
          <div className="success-overlay">
            <div className="success-message">
              <CheckCircle className="success-icon" />
              <h3 className="success-title">Report Submitted Successfully!</h3>
              <p className="success-text">Your disaster report has been received and will be reviewed by emergency responders. The SOS button is now active for emergencies.</p>
            </div>
          </div>
        )} 
      </div>
    </>
  );
};

export default Reports;