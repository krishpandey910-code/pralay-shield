# 🚨 Disaster Response Coordination Platform - API Documentation

## 🌐 **Overview**
This Flask API integrates all ML systems for disaster response coordination:
- **Population Impact Prediction** - ML-based affected population estimation
- **Resource Need Calculation** - Smart resource requirements calculation
- **Smart Resource Allocation** - Wastage-prevention resource distribution

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
pip install -r requirements_api.txt
```

### **2. Start API Server**
```bash
python disaster_response_api.py
```

### **3. API Available At**
- **Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/`
- **System Status**: `http://localhost:5000/api/system-status`

## 📡 **API Endpoints**

### **🏠 GET /** - API Information
Returns basic API information and available endpoints.

**Response:**
```json
{
  "message": "🚨 Disaster Response Coordination Platform API",
  "version": "1.0.0",
  "status": "active",
  "endpoints": {
    "GET /": "API Information",
    "POST /api/predict-population": "Predict affected population",
    "POST /api/calculate-resources": "Calculate resource needs",
    "POST /api/allocate-resources": "Allocate resources to disasters",
    "POST /api/full-disaster-analysis": "Complete disaster analysis",
    "GET /api/system-status": "Check system health"
  },
  "timestamp": "2025-08-24T00:10:00"
}
```

### **🏥 GET /api/system-status** - System Health Check
Returns the health status of all ML systems.

**Response:**
```json
{
  "api_status": "healthy",
  "timestamp": "2025-08-24T00:10:00",
  "ml_systems": {
    "population_prediction": "healthy",
    "resource_calculation": "healthy",
    "resource_allocation": "healthy"
  },
  "models_loaded": {
    "population_model": true,
    "resource_calculator": true,
    "allocation_system": true
  }
}
```

### **👥 POST /api/predict-population** - Population Prediction
Predicts affected population based on disaster details and weather.

**Request Body:**
```json
{
  "location": "Dehradun",
  "disaster_type": "flash_flood",
  "affected_area_percentage": 15,
  "weather_data": {
    "rainfall": 45.2,
    "wind_speed": 12.5,
    "humidity": 78.3,
    "temperature": 28.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "location": "Dehradun",
    "disaster_type": "flash_flood",
    "affected_area_percentage": 15,
    "predicted_affected_population": 52347,
    "weather_factors_applied": {
      "rainfall": 45.2,
      "wind_speed": 12.5,
      "humidity": 78.3,
      "temperature": 28.5
    },
    "timestamp": "2025-08-24T00:10:00"
  }
}
```

### **📦 POST /api/calculate-resources** - Resource Calculation
Calculates resource needs based on affected population and disaster type.

**Request Body:**
```json
{
  "affected_population": 50000,
  "disaster_type": "flash_flood",
  "duration_days": 7,
  "weather_data": {
    "rainfall": 45.2,
    "wind_speed": 12.5,
    "humidity": 78.3,
    "temperature": 28.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "resource_calculation": {
    "affected_population": 50000,
    "disaster_type": "flash_flood",
    "duration_days": 7,
    "calculated_resources": {
      "food": {
        "base_amount": 250000,
        "disaster_multiplier": 1.2,
        "weather_factor": "N/A (ML already considered weather)",
        "final_amount": 300000,
        "description": "Food packets for affected population",
        "details": "5 packets per person per day for 7 days"
      },
      "medical": {
        "base_amount": 500,
        "disaster_multiplier": 1.3,
        "weather_factor": "N/A (ML already considered weather)",
        "final_amount": 650,
        "description": "Medical staff required",
        "details": "1 staff per 100 people"
      }
    },
    "timestamp": "2025-08-24T00:10:00"
  }
}
```

### **🎯 POST /api/allocate-resources** - Resource Allocation
Allocates resources to multiple disasters using smart allocation with wastage prevention.

**Request Body:**
```json
{
  "available_resources": {
    "food_packets": 500000,
    "rescue_teams": 400,
    "medical_staff": 700
  },
  "disasters": [
    {
      "name": "Dehradun Flash Flood",
      "location": "Dehradun",
      "affected_people": 50000,
      "food_needed": 250000,
      "rescue_teams_needed": 150,
      "medical_staff_needed": 250
    },
    {
      "name": "Chamoli Earthquake",
      "location": "Chamoli",
      "affected_people": 25000,
      "food_needed": 125000,
      "rescue_teams_needed": 100,
      "medical_staff_needed": 200
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "resource_allocation": {
    "available_resources": {
      "food_packets": 500000,
      "rescue_teams": 400,
      "medical_staff": 700
    },
    "disasters_processed": 2,
    "allocations": {
      "Dehradun Flash Flood": {
        "food_allocated": 250000,
        "rescue_teams_allocated": 150,
        "medical_staff_allocated": 250,
        "food_coverage": 100.0,
        "rescue_coverage": 100.0,
        "medical_coverage": 100.0,
        "status": "FULLY_ALLOCATED",
        "priority_bonus": "N/A (no shortage)",
        "wastage_prevented": true
      },
      "Chamoli Earthquake": {
        "food_allocated": 125000,
        "rescue_teams_allocated": 100,
        "medical_staff_allocated": 200,
        "food_coverage": 100.0,
        "rescue_coverage": 100.0,
        "medical_coverage": 100.0,
        "status": "FULLY_ALLOCATED",
        "priority_bonus": "N/A (no shortage)",
        "wastage_prevented": true
      }
    },
    "wastage_analysis": {
      "food_wastage": 125000,
      "rescue_wastage": 150,
      "medical_wastage": 250
    },
    "timestamp": "2025-08-24T00:10:00"
  }
}
```

### **🚨 POST /api/full-disaster-analysis** - Complete Analysis
Performs complete disaster analysis: population prediction → resource calculation → resource allocation.

**Request Body:**
```json
{
  "disaster_info": {
    "location": "Dehradun",
    "disaster_type": "flash_flood",
    "affected_area_percentage": 15,
    "duration_days": 7
  },
  "weather_data": {
    "rainfall": 45.2,
    "wind_speed": 12.5,
    "humidity": 78.3,
    "temperature": 28.5
  },
  "available_resources": {
    "food_packets": 500000,
    "rescue_teams": 400,
    "medical_staff": 700
  }
}
```

**Response:**
```json
{
  "success": true,
  "full_analysis": {
    "disaster_info": {
      "location": "Dehradun",
      "disaster_type": "flash_flood",
      "affected_area_percentage": 15,
      "duration_days": 7
    },
    "weather_data": {
      "rainfall": 45.2,
      "wind_speed": 12.5,
      "humidity": 78.3,
      "temperature": 28.5
    },
    "step_1_population_prediction": {
      "predicted_affected_population": 52347,
      "weather_factors_applied": {...}
    },
    "step_2_resource_calculation": {
      "calculated_resources": {...}
    },
    "step_3_resource_allocation": {
      "allocations": {...},
      "available_resources": {...}
    },
    "timestamp": "2025-08-24T00:10:00"
  }
}
```

## 🔧 **Testing the API**

### **Run API Tests**
```bash
python test_api.py
```

### **Manual Testing with curl**
```bash
# Test health endpoint
curl http://localhost:5000/

# Test population prediction
curl -X POST http://localhost:5000/api/predict-population \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Dehradun",
    "disaster_type": "flash_flood",
    "affected_area_percentage": 15,
    "weather_data": {
      "rainfall": 45.2,
      "wind_speed": 12.5,
      "humidity": 78.3,
      "temperature": 28.5
    }
  }'
```

## 🌐 **Frontend Integration**

### **React/Node.js Integration**
```javascript
// Example React component
const predictPopulation = async (disasterData) => {
  try {
    const response = await fetch('http://localhost:5000/api/predict-population', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(disasterData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Predicted population:', result.prediction.predicted_affected_population);
    }
  } catch (error) {
    console.error('API call failed:', error);
  }
};
```

### **Python Integration**
```python
import requests

def call_disaster_api(disaster_data):
    response = requests.post(
        'http://localhost:5000/api/predict-population',
        json=disaster_data
    )
    return response.json()
```

## 🚨 **Error Handling**

### **Common HTTP Status Codes**
- **200**: Success
- **400**: Bad Request (missing/invalid fields)
- **500**: Internal Server Error
- **503**: Service Unavailable (ML system not ready)

### **Error Response Format**
```json
{
  "error": "Error description",
  "details": "Detailed error information"
}
```

## 🔒 **Security & CORS**

- **CORS Enabled**: Frontend can call from any origin
- **Input Validation**: All inputs are validated
- **Error Logging**: All errors are logged for debugging

## 📊 **Performance**

- **Response Time**: < 2 seconds for most operations
- **Concurrent Requests**: Supports multiple simultaneous requests
- **Memory Usage**: Efficient ML model loading

## 🚀 **Deployment**

### **Production Deployment**
```bash
# Install production dependencies
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 disaster_response_api:app
```

### **Environment Variables**
```bash
export FLASK_ENV=production
export FLASK_DEBUG=0
```

## 📞 **Support**

For issues or questions:
1. Check system status: `GET /api/system-status`
2. Review error logs in console
3. Ensure all ML models are loaded
4. Verify input data format

---

**🚨 Disaster Response Coordination Platform API v1.0.0**  
**Built with Flask, ML, and Smart Resource Management** 🧠✨
