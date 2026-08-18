#!/usr/bin/env python3
"""
Disaster Response Coordination Platform - Flask API
Integrates ML Population Prediction, Resource Calculation, and Smart Allocation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
from datetime import datetime
import warnings
import os
warnings.filterwarnings('ignore')

# Import our ML systems
from core.ml_based_prediction_system import MLBasedDisasterPredictionSystem
from core.resource_calculation_system import ResourceCalculationSystem
from core.smart_resource_allocator import SmartResourceAllocator, Disaster

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# -----------------------
# Helper utilities
# -----------------------
def _coerce_to_number(value):
    """Best-effort convert string numerics to int/float, otherwise return original."""
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        v = value.strip()
        if v.isdigit() or (v.startswith('-') and v[1:].isdigit()):
            try:
                return int(v)
            except Exception:
                pass
        try:
            return float(v)
        except Exception:
            return value
    return value

def parse_request_data(required_fields=None):
    """
    Parse incoming data from JSON body, form fields, raw body JSON, and query params.
    Returns (data_dict, error_response_or_None).
    """
    # 1) JSON body
    data = request.get_json(silent=True) or {}

    # 2) Form-encoded body (flatten into dict)
    if not data and request.form:
        data = {k: request.form.get(k) for k in request.form.keys()}
        # Try nested JSON in a common 'data' field
        nested = data.get('data')
        if isinstance(nested, str):
            try:
                parsed = json.loads(nested)
                if isinstance(parsed, dict):
                    data.update(parsed)
            except Exception:
                pass

    # 3) Raw body JSON
    if not data and request.data:
        try:
            raw_parsed = json.loads(request.data)
            if isinstance(raw_parsed, dict):
                data = raw_parsed
        except Exception:
            pass

    # 4) Merge query params (do not overwrite existing keys)
    if request.args:
        for key in request.args.keys():
            if key not in data:
                data[key] = request.args.get(key)

    # Coerce simple numeric strings
    for k, v in list(data.items()):
        if k.endswith('_percentage') or k.endswith('_percent') or k in {'affected_population', 'duration_days'}:
            data[k] = _coerce_to_number(v)

    # Validate required fields
    if required_fields:
        missing = [f for f in required_fields if f not in data or data.get(f) in (None, '')]
        if missing:
            return None, (jsonify({
                "error": "Missing required fields",
                "missing": missing,
                "hint": "Send JSON body with Content-Type: application/json, or pass as query params."
            }), 400)

    return data, None

# Initialize ML systems
prediction_system = None
resource_calculator = None
resource_allocator = None

def initialize_ml_systems():
    """Initialize ML systems."""
    global prediction_system, resource_calculator, resource_allocator
    try:
        prediction_system = MLBasedDisasterPredictionSystem()
        resource_calculator = ResourceCalculationSystem()
        resource_allocator = SmartResourceAllocator()
        logger.info("✅ All ML systems initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize ML systems: {e}")
        prediction_system = None
        resource_calculator = None
        resource_allocator = None

# Initialize ML systems
initialize_ml_systems()

@app.route('/')
def home():
    """API home endpoint."""
    return jsonify({
        "message": "🚨 Disaster Response Coordination Platform API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "GET /": "API Information",
            "GET|POST /api/predict-population": "Predict affected population",
            "POST /api/calculate-resources": "Calculate resource needs",
            "POST /api/allocate-resources": "Allocate resources to disasters",
            "POST /api/full-disaster-analysis": "Complete disaster analysis",
            "GET /api/system-status": "Check system health"
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/system-status')
def system_status():
    """Check the health status of all ML systems."""
    try:
        status = {
            "api_status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "ml_systems": {
                "population_prediction": "healthy" if prediction_system else "unhealthy",
                "resource_calculation": "healthy" if resource_calculator else "unhealthy",
                "resource_allocation": "healthy" if resource_allocator else "unhealthy"
            },
            "models_loaded": {
                "population_model": prediction_system is not None,
                "resource_calculator": resource_calculator is not None,
                "allocation_system": resource_allocator is not None
            }
        }
        return jsonify(status)
    except Exception as e:
        logger.error(f"System status check failed: {e}")
        return jsonify({"error": "System status check failed", "details": str(e)}), 500

@app.route('/api/predict-population', methods=['GET', 'POST'])
def predict_population():
    """
    Predict affected population based on disaster details and weather.
    
    Expected JSON:
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
    """
    try:
        required_fields = ['location', 'disaster_type', 'affected_area_percentage']
        # Parse without enforcing required fields first so we can support nested payloads
        data, _ = parse_request_data()

        # If payload comes as { "disaster_info": { ... } }, merge it
        if isinstance(data, dict) and isinstance(data.get('disaster_info'), dict):
            # Do not overwrite existing explicit top-level keys
            for k, v in data['disaster_info'].items():
                data.setdefault(k, v)

        # Validate required after potential merge
        missing = [f for f in required_fields if f not in data or data.get(f) in (None, '')]
        if missing:
            # On GET without params, return usage help
            if request.method == 'GET':
                return jsonify({
                    "message": "Usage: supply query params or JSON body",
                    "examples": {
                        "query": "/api/predict-population?location=Dehradun&disaster_type=flash_flood&affected_area_percentage=15",
                        "json_root": {"location": "Dehradun", "disaster_type": "flash_flood", "affected_area_percentage": 15},
                        "json_nested": {"disaster_info": {"location": "Dehradun", "disaster_type": "flash_flood", "affected_area_percentage": 15}}
                    },
                    "missing": missing
                }), 400
            return jsonify({
                "error": "Missing required fields",
                "missing": missing,
                "hint": "Send root-level fields or wrap inside 'disaster_info' object."
            }), 400

        # Extract data
        location = data['location']
        disaster_type = data['disaster_type']
        affected_area_percentage = data['affected_area_percentage']
        weather_data = data.get('weather_data', {})
        
        # Predict population
        if prediction_system:
            predicted_population = prediction_system.predict_disaster_impact(
                location=location,
                disaster_type=disaster_type,
                affected_area_percent=affected_area_percentage
            )
            
            response = {
                "success": True,
                "prediction": {
                    "location": location,
                    "disaster_type": disaster_type,
                    "affected_area_percentage": affected_area_percentage,
                    "predicted_affected_population": predicted_population['final_affected'],
                    "weather_factors_applied": predicted_population.get('weather_factors', {}),
                    "ml_confidence": predicted_population.get('model_confidence', 'Unknown'),
                    "timestamp": datetime.now().isoformat()
                }
            }
            return jsonify(response)
        else:
            return jsonify({"error": "Population prediction system not available"}), 503
            
    except Exception as e:
        logger.error(f"Population prediction failed: {e}")
        return jsonify({
            "error": "Population prediction failed",
            "details": str(e),
            "hint": "Verify JSON structure and Content-Type header, or use query params."
        }), 500

@app.route('/api/calculate-resources', methods=['POST'])
def calculate_resources():
    """
    Calculate resource needs based on affected population and disaster type.
    
    Expected JSON:
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
    """
    try:
        required_fields = ['affected_population', 'disaster_type']
        data, error = parse_request_data(required_fields)
        if error:
            return error

        # Extract data
        affected_population = data['affected_population']
        disaster_type = data['disaster_type']
        duration_days = data.get('duration_days', 7)
        weather_data = data.get('weather_data', {})
        
        # Calculate resources
        if resource_calculator:
            resources = resource_calculator.calculate_resource_needs(
                affected_population=affected_population,
                disaster_type=disaster_type,
                weather_data=weather_data,
                duration_days=duration_days
            )
            
            response = {
                "success": True,
                "resource_calculation": {
                    "affected_population": affected_population,
                    "disaster_type": disaster_type,
                    "duration_days": duration_days,
                    "calculated_resources": resources,
                    "timestamp": datetime.now().isoformat()
                }
            }
            return jsonify(response)
        else:
            return jsonify({"error": "Resource calculation system not available"}), 503
            
    except Exception as e:
        logger.error(f"Resource calculation failed: {e}")
        return jsonify({
            "error": "Resource calculation failed",
            "details": str(e),
            "hint": "Provide 'affected_population' and 'disaster_type' in JSON body."
        }), 500

@app.route('/api/allocate-resources', methods=['POST'])
def allocate_resources():
    """
    Allocate resources to multiple disasters using smart allocation.
    
    Expected JSON:
    {
        "available_resources": {
            "food_packets": 500000,
            "rescue_teams": 400,
            "medical_staff": 700
        },
        "disasters": [
            {
                "name": "Dehradun Flood",
                "location": "Dehradun",
                "affected_people": 50000,
                "food_needed": 250000,
                "rescue_teams_needed": 150,
                "medical_staff_needed": 250
            }
        ]
    }
    """
    try:
        data, error = parse_request_data()
        if error:
            return error

        # Validate required fields
        if 'available_resources' not in data or 'disasters' not in data:
            return jsonify({"error": "Missing required fields: available_resources and disasters"}), 400

        # Extract data
        available_resources = data['available_resources']
        disasters_data = data['disasters']
        
        # Validate disasters data
        if not disasters_data or not isinstance(disasters_data, list):
            return jsonify({"error": "disasters must be a non-empty list"}), 400
        
        # Create Disaster objects
        disasters = []
        for disaster_data in disasters_data:
            required_fields = ['name', 'location', 'affected_people', 'food_needed', 'rescue_teams_needed', 'medical_staff_needed']
            for field in required_fields:
                if field not in disaster_data:
                    return jsonify({"error": f"Missing field '{field}' in disaster data"}), 400
            
            disaster = Disaster(
                name=disaster_data['name'],
                location=disaster_data['location'],
                affected_people=disaster_data['affected_people'],
                food_needed=disaster_data['food_needed'],
                rescue_teams_needed=disaster_data['rescue_teams_needed'],
                medical_staff_needed=disaster_data['medical_staff_needed']
            )
            disasters.append(disaster)
        
        # Set available resources
        resource_allocator.set_available_resources(
            food_packets=available_resources.get('food_packets', 0),
            rescue_teams=available_resources.get('rescue_teams', 0),
            medical_staff=available_resources.get('medical_staff', 0)
        )
        
        # Allocate resources
        if resource_allocator:
            allocations = resource_allocator.allocate_resources(disasters)
            
            # Calculate wastage analysis
            total_allocated_food = sum(a['food_allocated'] for a in allocations.values())
            total_allocated_rescue = sum(a['rescue_teams_allocated'] for a in allocations.values())
            total_allocated_medical = sum(a['medical_staff_allocated'] for a in allocations.values())
            
            wastage_analysis = {
                "food_wastage": available_resources.get('food_packets', 0) - total_allocated_food,
                "rescue_wastage": available_resources.get('rescue_teams', 0) - total_allocated_rescue,
                "medical_wastage": available_resources.get('medical_staff', 0) - total_allocated_medical
            }
            
            response = {
                "success": True,
                "resource_allocation": {
                    "available_resources": available_resources,
                    "disasters_processed": len(disasters),
                    "allocations": allocations,
                    "wastage_analysis": wastage_analysis,
                    "timestamp": datetime.now().isoformat()
                }
            }
            return jsonify(response)
        else:
            return jsonify({"error": "Resource allocation system not available"}), 503
            
    except Exception as e:
        logger.error(f"Resource allocation failed: {e}")
        return jsonify({
            "error": "Resource allocation failed",
            "details": str(e),
            "hint": "Ensure 'available_resources' and a non-empty 'disasters' array with required fields."
        }), 500

@app.route('/api/full-disaster-analysis', methods=['POST'])
def full_disaster_analysis():
    """
    Complete disaster analysis: predict population, calculate resources, and allocate.
    
    Expected JSON:
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
    """
    try:
        data, error = parse_request_data()
        if error:
            return error

        # Validate required fields
        if 'disaster_info' not in data:
            return jsonify({"error": "Missing required field: disaster_info"}), 400
        
        disaster_info = data['disaster_info']
        weather_data = data.get('weather_data', {})
        available_resources = data.get('available_resources', {})
        
        # Step 1: Predict population
        if prediction_system:
            predicted_population = prediction_system.predict_disaster_impact(
                location=disaster_info['location'],
                disaster_type=disaster_info['disaster_type'],
                affected_area_percent=disaster_info['affected_area_percentage']
            )
        else:
            return jsonify({"error": "Population prediction system not available"}), 503
        
        # Step 2: Calculate resources
        if resource_calculator:
            resources = resource_calculator.calculate_resource_needs(
                affected_population=predicted_population.get('final_affected', 0),
                disaster_type=disaster_info['disaster_type'],
                weather_data=weather_data,
                duration_days=disaster_info.get('duration_days', 7)
            )
        else:
            return jsonify({"error": "Resource calculation system not available"}), 503
        
        # Step 3: Create disaster object for allocation
        # Extract resource amounts safely
        food_amount = resources.get('food', {}).get('final_amount', 0)
        rescue_amount = resources.get('rescue', {}).get('final_amount', 0)
        medical_amount = resources.get('medical', {}).get('final_amount', 0)
        
        # Handle dict amounts by taking a representative value
        if isinstance(food_amount, dict):
            food_amount = food_amount.get('food_packets', 0)
        if isinstance(rescue_amount, dict):
            rescue_amount = rescue_amount.get('rescue_teams', 0)
        if isinstance(medical_amount, dict):
            medical_amount = medical_amount.get('medical_staff', 0)
            
        disaster = Disaster(
            name=f"{disaster_info['location']} {disaster_info['disaster_type'].replace('_', ' ').title()}",
            location=disaster_info['location'],
            affected_people=predicted_population.get('final_affected', 0),
            food_needed=int(food_amount) if food_amount else 0,
            rescue_teams_needed=int(rescue_amount) if rescue_amount else 0,
            medical_staff_needed=int(medical_amount) if medical_amount else 0
        )
        
        # Step 4: Allocate resources
        if resource_allocator and available_resources:
            resource_allocator.set_available_resources(
                food_packets=available_resources.get('food_packets', 0),
                rescue_teams=available_resources.get('rescue_teams', 0),
                medical_staff=available_resources.get('medical_staff', 0)
            )
            
            allocations = resource_allocator.allocate_resources([disaster])
        else:
            allocations = None
        
        # Prepare comprehensive response
        response = {
            "success": True,
            "full_analysis": {
                "disaster_info": disaster_info,
                "weather_data": weather_data,
                "step_1_population_prediction": {
                    "predicted_affected_population": predicted_population['final_affected'],
                    "weather_factors_applied": predicted_population.get('weather_factors', {}),
                    "ml_confidence": predicted_population.get('model_confidence', 'Unknown')
                },
                "step_2_resource_calculation": {
                    "calculated_resources": resources
                },
                "step_3_resource_allocation": {
                    "allocations": allocations,
                    "available_resources": available_resources
                },
                "timestamp": datetime.now().isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Full disaster analysis failed: {e}")
        return jsonify({
            "error": "Full disaster analysis failed",
            "details": str(e),
            "hint": "Provide 'disaster_info' object and optional 'available_resources'/'weather_data'."
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    host = os.environ.get('ML_HOST', 'localhost')
    try:
        port = int(os.environ.get('ML_PORT', '5002'))
    except Exception:
        port = 5002

    logger.info("🚀 Starting Disaster Response Coordination Platform API")
    logger.info(f"📡 API will be available at: http://{host}:{port}")
    logger.info("🌐 CORS enabled for frontend integration")
    
    try:
        app.run(host=host, port=port, debug=False)
    except Exception as e:
        logger.error(f"❌ Failed to start API server: {e}")
        raise
