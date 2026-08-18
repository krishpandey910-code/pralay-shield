#!/usr/bin/env python3
"""
Test Script for Disaster Response Platform API
Demonstrates how to use all API endpoints
"""

import requests
import json
from datetime import datetime

# API Base URL
API_BASE_URL = "http://localhost:5000"

def test_api_health():
    """Test API health and system status."""
    print("🏥 Testing API Health...")
    
    try:
        # Test home endpoint
        response = requests.get(f"{API_BASE_URL}/")
        if response.status_code == 200:
            print("✅ Home endpoint working")
            print(f"   Message: {response.json()['message']}")
        else:
            print(f"❌ Home endpoint failed: {response.status_code}")
        
        # Test system status
        response = requests.get(f"{API_BASE_URL}/api/system-status")
        if response.status_code == 200:
            status = response.json()
            print("✅ System status endpoint working")
            print(f"   ML Systems: {status['ml_systems']}")
        else:
            print(f"❌ System status failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure the Flask server is running!")
        print("   Run: python disaster_response_api.py")
        return False
    
    return True

def test_population_prediction():
    """Test population prediction endpoint."""
    print("\n👥 Testing Population Prediction...")
    
    payload = {
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
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/predict-population",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Population prediction successful!")
            print(f"   Location: {result['prediction']['location']}")
            print(f"   Disaster Type: {result['prediction']['disaster_type']}")
            print(f"   Predicted Population: {result['prediction']['predicted_affected_population']:,}")
            return result['prediction']['predicted_affected_population']
        else:
            print(f"❌ Population prediction failed: {response.status_code}")
            print(f"   Error: {response.json()}")
            return None
            
    except Exception as e:
        print(f"❌ Population prediction error: {e}")
        return None

def test_resource_calculation(affected_population):
    """Test resource calculation endpoint."""
    print("\n📦 Testing Resource Calculation...")
    
    if not affected_population:
        print("⚠️ Skipping resource calculation - no population data")
        return None
    
    payload = {
        "affected_population": affected_population,
        "disaster_type": "flash_flood",
        "duration_days": 7,
        "weather_data": {
            "rainfall": 45.2,
            "wind_speed": 12.5,
            "humidity": 78.3,
            "temperature": 28.5
        }
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/calculate-resources",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Resource calculation successful!")
            resources = result['resource_calculation']['calculated_resources']
            
            print("   Calculated Resources:")
            for category, data in resources.items():
                if isinstance(data, dict) and 'final_amount' in data:
                    print(f"     {category.title()}: {data['final_amount']}")
            
            return resources
        else:
            print(f"❌ Resource calculation failed: {response.status_code}")
            print(f"   Error: {response.json()}")
            return None
            
    except Exception as e:
        print(f"❌ Resource calculation error: {e}")
        return None

def test_resource_allocation():
    """Test resource allocation endpoint."""
    print("\n🎯 Testing Resource Allocation...")
    
    payload = {
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
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/allocate-resources",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Resource allocation successful!")
            
            allocation = result['resource_allocation']
            print(f"   Disasters Processed: {allocation['disasters_processed']}")
            print(f"   Available Resources: {allocation['available_resources']}")
            
            print("   Allocations:")
            for disaster_name, data in allocation['allocations'].items():
                print(f"     {disaster_name}:")
                print(f"       Food: {data['food_allocated']:,} / {data['food_coverage']:.1f}%")
                print(f"       Rescue: {data['rescue_teams_allocated']} / {data['rescue_coverage']:.1f}%")
                print(f"       Medical: {data['medical_staff_allocated']} / {data['medical_coverage']:.1f}%")
            
            wastage = allocation['wastage_analysis']
            print(f"   Wastage Prevention:")
            print(f"     Food Saved: {wastage['food_wastage']:,} packets")
            print(f"     Rescue Teams Saved: {wastage['rescue_wastage']} teams")
            print(f"     Medical Staff Saved: {wastage['medical_wastage']} staff")
            
            return allocation
        else:
            print(f"❌ Resource allocation failed: {response.status_code}")
            print(f"   Error: {response.json()}")
            return None
            
    except Exception as e:
        print(f"❌ Resource allocation error: {e}")
        return None

def test_full_disaster_analysis():
    """Test complete disaster analysis endpoint."""
    print("\n🚨 Testing Full Disaster Analysis...")
    
    payload = {
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
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/full-disaster-analysis",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Full disaster analysis successful!")
            
            analysis = result['full_analysis']
            
            print("   📊 Analysis Summary:")
            print(f"     Step 1 - Population: {analysis['step_1_population_prediction']['predicted_affected_population']:,} people")
            
            resources = analysis['step_2_resource_calculation']['calculated_resources']
            print("     Step 2 - Resources Calculated:")
            for category, data in resources.items():
                if isinstance(data, dict) and 'final_amount' in data:
                    print(f"       {category.title()}: {data['final_amount']}")
            
            if analysis['step_3_resource_allocation']['allocations']:
                print("     Step 3 - Resources Allocated Successfully")
            else:
                print("     Step 3 - No Resource Allocation (no available resources)")
            
            return analysis
        else:
            print(f"❌ Full disaster analysis failed: {response.status_code}")
            print(f"   Error: {response.json()}")
            return None
            
    except Exception as e:
        print(f"❌ Full disaster analysis error: {e}")
        return None

def main():
    """Run all API tests."""
    print("🧪 DISASTER RESPONSE PLATFORM API TESTING")
    print("=" * 60)
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 API Base URL: {API_BASE_URL}")
    
    # Test 1: API Health
    if not test_api_health():
        return
    
    # Test 2: Population Prediction
    predicted_population = test_population_prediction()
    
    # Test 3: Resource Calculation
    resources = test_resource_calculation(predicted_population)
    
    # Test 4: Resource Allocation
    allocation = test_resource_allocation()
    
    # Test 5: Full Disaster Analysis
    full_analysis = test_full_disaster_analysis()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 5
    
    if predicted_population:
        tests_passed += 1
        print("✅ Population Prediction: PASSED")
    else:
        print("❌ Population Prediction: FAILED")
    
    if resources:
        tests_passed += 1
        print("✅ Resource Calculation: PASSED")
    else:
        print("❌ Resource Calculation: FAILED")
    
    if allocation:
        tests_passed += 1
        print("✅ Resource Allocation: PASSED")
    else:
        print("❌ Resource Allocation: FAILED")
    
    if full_analysis:
        tests_passed += 1
        print("✅ Full Disaster Analysis: PASSED")
    else:
        print("❌ Full Disaster Analysis: FAILED")
    
    print(f"\n🎯 Overall Result: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🚀 All tests passed! API is working perfectly!")
    else:
        print("⚠️ Some tests failed. Check the errors above.")
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
