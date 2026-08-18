# 🚨 Disaster Response Coordination Platform - ML System

**AI-Powered Disaster Response Forecasting System** for predicting affected population and resource allocation.

## 🎯 Features

- **ML Population Prediction**: Predict affected population based on location, disaster type, and weather
- **Resource Calculation**: Calculate food, medical, and rescue team requirements
- **Smart Resource Allocation**: Dynamic allocation with wastage prevention
- **RESTful API**: Ready for frontend integration
- **Real-time Weather Integration**: Weather-based impact adjustment

## 📁 Project Structure

```
ML/
├── core/                          # Core ML systems
│   ├── ml_based_prediction_system.py
│   ├── resource_calculation_system.py
│   ├── smart_resource_allocator.py
│   └── train_population_estimate_model.py
├── models/                        # Trained ML models
│   ├── population_estimate_model_gradientboosting.joblib
│   ├── population_estimate_encoders.joblib
│   ├── population_estimate_scaler.joblib
│   └── population_estimate_training_results.png
├── data/                          # Data files
│   ├── raw/                       # Original data
│   └── processed/                 # Processed data
├── tests/                         # Test files
│   └── test_api.py
├── docs/                          # Documentation
│   ├── README.md
│   ├── QUICK_START.md
│   ├── API_README.md
│   └── UTTARAKHAND_README.md
├── disaster_response_api.py       # Main Flask API
├── requirements.txt               # Dependencies
└── README.md                      # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure (optional)
Create a `.env` (or set env vars) for host/port in VS Code terminal:
```
ML_HOST=localhost
ML_PORT=5002
```

### 3. Run the API
```bash
python disaster_response_api.py
```

### 4. Test the API
```bash
python tests/test_api.py
```

### 5. Access API
- Default URL: `http://localhost:5002` (configurable by ML_PORT)
- **Health Check**: `GET /`
- **Population Prediction**: `POST /api/predict-population`
- **Resource Calculation**: `POST /api/calculate-resources`
- **Resource Allocation**: `POST /api/allocate-resources`
- **Full Analysis**: `POST /api/full-disaster-analysis`

## 📊 API Endpoints

### Population Prediction
```json
POST /api/predict-population
{
    "location": "Dehradun",
    "disaster_type": "flash_flood",
    "affected_area_percentage": 20
}
```

### Resource Calculation
```json
POST /api/calculate-resources
{
    "affected_population": 87178,
    "disaster_type": "flash_flood"
}
```

### Full Disaster Analysis
```json
POST /api/full-disaster-analysis
{
    "disaster_info": {
        "location": "Dehradun",
        "disaster_type": "flash_flood",
        "affected_area_percentage": 20
    },
    "available_resources": {
        "food": 500000,
        "rescue_teams": 400,
        "medical_staff": 700
    }
}
```

## 🔧 System Requirements

- **Python**: 3.8 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **OS**: Windows/Linux/macOS

## 📚 Documentation

- **Quick Start**: `docs/QUICK_START.md`
- **API Documentation**: `docs/API_README.md`
- **Uttarakhand System**: `docs/UTTARAKHAND_README.md`

## 🤝 Integration

This ML system is designed to integrate with:
- **Frontend**: React.js applications
- **Backend**: Node.js/Flask applications
- **Database**: MongoDB/PostgreSQL
- **Real-time**: WebSocket connections

## 🎯 Use Cases

1. **Emergency Response**: Quick population impact assessment
2. **Resource Planning**: Optimal resource allocation
3. **Disaster Management**: Coordinated response planning
4. **Real-time Monitoring**: Live disaster impact tracking

## 📞 Support

For technical support or questions, refer to the documentation in the `docs/` folder.

---

**Built for Disaster Response Coordination Platform** 🚨
