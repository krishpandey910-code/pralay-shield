const ResultDisplay = ({ result }) => {
  if (!result) return null;

  const isDisaster = result.prediction === "disaster";
  
  return (
    <div className="result-display">
      <h3>📊 Analysis Result</h3>
      <div className="result-content">
        <div className="analyzed-text">
          <strong>Analyzed Text:</strong> "{result.text}"
        </div>
        
        <div className="prediction-result">
          <span>Classification:</span>
          <span className={`prediction-badge ${isDisaster ? 'disaster' : 'not-disaster'}`}>
            {isDisaster ? '🚨 Disaster' : '✅ Not Disaster'}
          </span>
        </div>
        
        {result.confidence && (
          <div className="confidence-score">
            <span style={{ color: '#666' }}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </span>
          </div>
        )}
        
        <div className="timestamp">
          Analyzed on {result.timestamp}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;