const PredictionHistory = ({ history, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="prediction-history">
      <div className="history-header">
        <h3>📋 Recent Predictions ({history.length})</h3>
        <button className="clear-button" onClick={onClear}>
          Clear History
        </button>
      </div>
      
      <div className="history-list">
        {history.map((item, index) => (
          <div key={index} className="history-item">
            <div className="history-item-text">
              "{item.text}"
            </div>
            <div className="history-item-meta">
              <span className={`history-prediction ${item.prediction.replace(' ', '-')}`}>
                {item.prediction === 'disaster' ? '🚨 Disaster' : '✅ Not Disaster'}
              </span>
              <span className="history-timestamp">
                {item.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictionHistory;