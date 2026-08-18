const PredictionForm = ({ text, setText, onPredict, isLoading, error }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onPredict();
    }
  };

  const exampleTweets = [
    "Forest fire near Highway 1, evacuation in progress",
    "Just saw the most beautiful sunset today!",
    "Earthquake magnitude 6.2 hits the coast",
    "Having coffee with friends at the new cafe"
  ];

  const handleExampleClick = (exampleText) => {
    setText(exampleText);
  };

  return (
    <div className="prediction-form">
      <div className="input-group">
        <label htmlFor="tweet-input">
          Enter a tweet or message to analyze:
        </label>
        <textarea
          id="tweet-input"
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type or paste a tweet here... (Ctrl/Cmd + Enter to predict)"
          disabled={isLoading}
        />
        
        <div className="examples">
          <small style={{ color: '#666', marginBottom: '10px', display: 'block' }}>
            Try these examples:
          </small>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {exampleTweets.map((example, index) => (
              <button
                key={index}
                className="example-button"
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                style={{
                  padding: '6px 12px',
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#495057'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.background = '#e9ecef';
                    e.target.style.borderColor = '#667eea';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.borderColor = '#dee2e6';
                }}
              >
                {example.length > 40 ? example.substring(0, 37) + '...' : example}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <button 
        className="predict-button" 
        onClick={onPredict} 
        disabled={isLoading || !text.trim()}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            Analyzing...
          </>
        ) : (
          'Analyze Tweet'
        )}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default PredictionForm;