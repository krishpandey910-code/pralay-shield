#!/usr/bin/env python3
"""
Resource Need Calculation System for Disaster Rescue Coordination Platform
Calculates resource requirements based on ML predictions and disaster characteristics
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResourceCalculationSystem:
    """Calculate resource needs based on disaster impact predictions."""
    
    def __init__(self):
        """Initialize the resource calculation system."""
        self.resource_standards = self._load_resource_standards()
        self.disaster_resource_multipliers = self._load_disaster_resource_multipliers()
        self.weather_resource_factors = self._load_weather_resource_factors()
        
    def _load_resource_standards(self):
        """Load standard resource requirements per 1000 affected people."""
        return {
            'food': {
                'daily_meals_per_person': 3,
                'calories_per_meal': 2500,
                'food_packets_per_day': 3,
                'water_liters_per_day': 5,
                'description': 'Emergency food and water supplies'
            },
            'medical': {
                'first_aid_kits_per_100': 2,
                'medicines_per_person': 1,
                'medical_staff_per_1000': 5,
                'ambulances_per_1000': 2,
                'description': 'Medical supplies and emergency care'
            },
            'shelter': {
                'tents_per_family': 1,
                'family_size': 5,
                'blankets_per_person': 2,
                'sleeping_bags_per_person': 1,
                'description': 'Emergency shelter and bedding'
            },
            'rescue': {
                'rescue_teams_per_1000': 3,
                'boats_per_1000': 1,
                'helicopters_per_1000': 0.5,
                'bulldozers_per_1000': 0.3,
                'description': 'Search and rescue equipment'
            },
            'communication': {
                'satellite_phones_per_1000': 2,
                'walkie_talkies_per_1000': 10,
                'generators_per_1000': 1,
                'description': 'Communication and power equipment'
            },
            'logistics': {
                'trucks_per_1000': 2,
                'fuel_liters_per_day': 100,
                'description': 'Transportation and logistics'
            }
        }
    
    def _load_disaster_resource_multipliers(self):
        """Load resource multipliers based on disaster type."""
        return {
            'flood': {
                'food': 1.2,      # More food due to water contamination
                'medical': 1.3,    # More medical due to waterborne diseases
                'shelter': 1.5,    # More shelter due to displacement
                'rescue': 1.8,     # More rescue due to water rescue needs
                'communication': 1.2,
                'logistics': 1.4
            },
            'landslide': {
                'food': 1.1,
                'medical': 1.4,    # More medical due to injuries
                'shelter': 1.3,
                'rescue': 1.6,     # More rescue due to debris removal
                'communication': 1.3,
                'logistics': 1.5
            },
            'earthquake': {
                'food': 1.0,
                'medical': 1.8,    # Much more medical due to injuries
                'shelter': 1.7,    # More shelter due to building damage
                'rescue': 2.0,     # Much more rescue due to building collapse
                'communication': 1.5,
                'logistics': 1.6
            },
            'flash_flood': {
                'food': 1.3,
                'medical': 1.4,
                'shelter': 1.6,
                'rescue': 1.9,
                'communication': 1.4,
                'logistics': 1.5
            },
            'cloudburst': {
                'food': 1.2,
                'medical': 1.2,
                'shelter': 1.4,
                'rescue': 1.7,
                'communication': 1.3,
                'logistics': 1.4
            },
            'avalanche': {
                'food': 1.1,
                'medical': 1.5,
                'shelter': 1.2,
                'rescue': 1.8,
                'communication': 1.4,
                'logistics': 1.3
            }
        }
    
    def _load_weather_resource_factors(self):
        """Load weather-based resource adjustment factors."""
        return {
            'rainfall': {
                'heavy': {'factor': 1.3, 'threshold': 100},      # >100mm
                'moderate': {'factor': 1.15, 'threshold': 50},   # 50-100mm
                'light': {'factor': 1.05, 'threshold': 25},      # 25-50mm
                'minimal': {'factor': 1.0, 'threshold': 0}       # <25mm
            },
            'wind': {
                'strong': {'factor': 1.2, 'threshold': 40},      # >40 km/h
                'moderate': {'factor': 1.1, 'threshold': 20},    # 20-40 km/h
                'light': {'factor': 1.05, 'threshold': 10},      # 10-20 km/h
                'calm': {'factor': 1.0, 'threshold': 0}          # <10 km/h
            },
            'temperature': {
                'extreme_cold': {'factor': 1.4, 'threshold': 5}, # <5°C
                'cold': {'factor': 1.2, 'threshold': 15},        # 5-15°C
                'moderate': {'factor': 1.0, 'threshold': 30},    # 15-30°C
                'hot': {'factor': 1.1, 'threshold': 35},         # 30-35°C
                'extreme_hot': {'factor': 1.3, 'threshold': 100} # >35°C
            }
        }
    
    def calculate_resource_needs(self, affected_population, disaster_type, weather_data, duration_days=7):
        """
        Calculate comprehensive resource needs.
        
        Args:
            affected_population (int): Number of affected people
            disaster_type (str): Type of disaster
            weather_data (dict): Current weather conditions
            duration_days (int): Expected duration of emergency response
            
        Returns:
            dict: Comprehensive resource requirements
        """
        try:
            logger.info(f"Calculating resources for {affected_population:,} people affected by {disaster_type}")
            
            # Get base multipliers
            disaster_multipliers = self.disaster_resource_multipliers.get(disaster_type, {})
            
            # Calculate weather factors
            weather_factors = self._calculate_weather_resource_factors(weather_data)
            
            # Calculate resources for each category
            resources = {}
            
            for category, standards in self.resource_standards.items():
                # Base calculation
                base_amount = self._calculate_base_resource_amount(
                    category, standards, affected_population, duration_days
                )
                
                # Apply disaster multiplier
                disaster_multiplier = disaster_multipliers.get(category, 1.0)
                
                # Weather factor removed - ML already considered weather in population estimation!
                # weather_factor = weather_factors.get(category, 1.0)  # REMOVED
                
                # Final calculation - only disaster multiplier (no weather factor)
                if isinstance(base_amount, dict):
                    # For dict amounts, multiply each value
                    final_amount = {}
                    for key, value in base_amount.items():
                        if isinstance(value, (int, float)):
                            final_amount[key] = int(value * disaster_multiplier)  # Weather factor removed
                        else:
                            final_amount[key] = value
                else:
                    # For scalar amounts
                    final_amount = base_amount * disaster_multiplier  # Weather factor removed
                
                resources[category] = {
                    'base_amount': base_amount,
                    'disaster_multiplier': disaster_multiplier,
                    'weather_factor': 'N/A (ML already considered weather)',  # Updated
                    'final_amount': final_amount,
                    'description': standards.get('description', ''),
                    'details': self._get_resource_details(category, final_amount, affected_population)
                }
            
            # Add summary
            resources['summary'] = self._generate_resource_summary(resources, affected_population, disaster_type)
            
            logger.info(f"Resource calculation completed for {disaster_type}")
            return resources
            
        except Exception as e:
            logger.error(f"Error in resource calculation: {e}")
            raise
    
    def _calculate_base_resource_amount(self, category, standards, population, duration):
        """Calculate base resource amount for a category."""
        if category == 'food':
            return {
                'food_packets': standards['food_packets_per_day'] * population * duration,
                'water_liters': standards['water_liters_per_day'] * population * duration
            }
        elif category == 'medical':
            return {
                'first_aid_kits': int((standards['first_aid_kits_per_100'] * population) / 100),
                'medicines': standards['medicines_per_person'] * population,
                'medical_staff': int((standards['medical_staff_per_1000'] * population) / 1000),
                'ambulances': int((standards['ambulances_per_1000'] * population) / 1000)
            }
        elif category == 'shelter':
            families = int(population / standards['family_size'])
            return {
                'tents': families,
                'blankets': standards['blankets_per_person'] * population,
                'sleeping_bags': standards['sleeping_bags_per_person'] * population
            }
        elif category == 'rescue':
            return {
                'rescue_teams': int((standards['rescue_teams_per_1000'] * population) / 1000),
                'boats': int((standards['boats_per_1000'] * population) / 1000),
                'helicopters': int((standards['helicopters_per_1000'] * population) / 1000),
                'bulldozers': int((standards['bulldozers_per_1000'] * population) / 1000)
            }
        elif category == 'communication':
            return {
                'satellite_phones': int((standards['satellite_phones_per_1000'] * population) / 1000),
                'walkie_talkies': int((standards['walkie_talkies_per_1000'] * population) / 1000),
                'generators': int((standards['generators_per_1000'] * population) / 1000)
            }
        elif category == 'logistics':
            return {
                'trucks': int((standards['trucks_per_1000'] * population) / 1000),
                'fuel_liters': standards['fuel_liters_per_day'] * duration
            }
        else:
            return 0
    
    def _calculate_weather_resource_factors(self, weather_data):
        """Calculate weather-based resource adjustment factors."""
        factors = {}
        
        # Rainfall factor
        rainfall = weather_data.get('rainfall', 0)
        if rainfall > 100:
            rainfall_factor = self.weather_resource_factors['rainfall']['heavy']['factor']
        elif rainfall > 50:
            rainfall_factor = self.weather_resource_factors['rainfall']['moderate']['factor']
        elif rainfall > 25:
            rainfall_factor = self.weather_resource_factors['rainfall']['light']['factor']
        else:
            rainfall_factor = self.weather_resource_factors['rainfall']['minimal']['factor']
        
        # Wind factor
        wind_speed = weather_data.get('wind_speed', 0)
        if wind_speed > 40:
            wind_factor = self.weather_resource_factors['wind']['strong']['factor']
        elif wind_speed > 20:
            wind_factor = self.weather_resource_factors['wind']['moderate']['factor']
        elif wind_speed > 10:
            wind_factor = self.weather_resource_factors['wind']['light']['factor']
        else:
            wind_factor = self.weather_resource_factors['wind']['calm']['factor']
        
        # Temperature factor
        temperature = weather_data.get('temperature', 25)
        if temperature < 5:
            temp_factor = self.weather_resource_factors['temperature']['extreme_cold']['factor']
        elif temperature < 15:
            temp_factor = self.weather_resource_factors['temperature']['cold']['factor']
        elif temperature < 30:
            temp_factor = self.weather_resource_factors['temperature']['moderate']['factor']
        elif temperature < 35:
            temp_factor = self.weather_resource_factors['temperature']['hot']['factor']
        else:
            temp_factor = self.weather_resource_factors['temperature']['extreme_hot']['factor']
        
        # Apply factors to different resource categories
        factors['food'] = (rainfall_factor + temp_factor) / 2
        factors['medical'] = (rainfall_factor + temp_factor) / 2
        factors['shelter'] = temp_factor
        factors['rescue'] = (rainfall_factor + wind_factor) / 2
        factors['communication'] = wind_factor
        factors['logistics'] = (rainfall_factor + wind_factor) / 2
        
        return factors
    
    def _get_resource_details(self, category, amount, population):
        """Get detailed breakdown of resources."""
        if category == 'food':
            return {
                'daily_meals': f"{amount['food_packets']:,} food packets for {population:,} people",
                'water_supply': f"{amount['water_liters']:,} liters of water for {population:,} people"
            }
        elif category == 'medical':
            return {
                'emergency_care': f"{amount['first_aid_kits']} first aid kits, {amount['medicines']:,} medicine units",
                'medical_staff': f"{amount['medical_staff']} medical staff, {amount['ambulances']} ambulances"
            }
        elif category == 'shelter':
            return {
                'accommodation': f"{amount['tents']} family tents, {amount['blankets']:,} blankets",
                'bedding': f"{amount['sleeping_bags']:,} sleeping bags for {population:,} people"
            }
        elif category == 'rescue':
            return {
                'rescue_teams': f"{amount['rescue_teams']} rescue teams, {amount['boats']} boats",
                'heavy_equipment': f"{amount['helicopters']} helicopters, {amount['bulldozers']} bulldozers"
            }
        elif category == 'communication':
            return {
                'communication': f"{amount['satellite_phones']} satellite phones, {amount['walkie_talkies']} walkie talkies",
                'power': f"{amount['generators']} generators for communication equipment"
            }
        elif category == 'logistics':
            return {
                'transport': f"{amount['trucks']} trucks for resource distribution",
                'fuel': f"{amount['fuel_liters']:,} liters of fuel for {amount['trucks']} trucks"
            }
        else:
            return {}
    
    def _generate_resource_summary(self, resources, population, disaster_type):
        """Generate a comprehensive resource summary."""
        total_cost_estimate = 0  # In real system, this would calculate actual costs
        
        summary = {
            'affected_population': population,
            'disaster_type': disaster_type,
            'resource_categories': len([k for k in resources.keys() if k != 'summary']),
            'priority_resources': self._identify_priority_resources(resources),
            'deployment_strategy': self._generate_deployment_strategy(resources, disaster_type),
            'estimated_duration': '7-14 days based on disaster severity',
            'coordination_notes': self._generate_coordination_notes(disaster_type, population)
        }
        
        return summary
    
    def _identify_priority_resources(self, resources):
        """Identify high-priority resources for immediate deployment."""
        priorities = []
        
        for category, data in resources.items():
            if category == 'summary':
                continue
            
            if category in ['medical', 'rescue']:
                priorities.append(f"🚨 {category.title()}: Immediate deployment required")
            elif category in ['food', 'shelter']:
                priorities.append(f"⚡ {category.title()}: Deploy within 2-4 hours")
            else:
                priorities.append(f"📋 {category.title()}: Deploy within 6-8 hours")
        
        return priorities
    
    def _generate_deployment_strategy(self, resources, disaster_type):
        """Generate deployment strategy based on disaster type and resources."""
        if disaster_type in ['earthquake', 'flash_flood']:
            return "Immediate deployment: Medical and rescue teams first, followed by shelter and food"
        elif disaster_type in ['flood', 'landslide']:
            return "Rapid deployment: Shelter and rescue equipment first, followed by medical and food"
        else:
            return "Standard deployment: All resources deployed simultaneously based on priority"
    
    def _generate_coordination_notes(self, disaster_type, population):
        """Generate coordination notes for agencies."""
        notes = [
            f"Coordinate with {disaster_type.title()} response agencies",
            f"Establish command center for {population:,} affected people",
            f"Set up communication network for all deployed teams",
            "Monitor weather conditions for resource adjustments",
            "Establish supply chain for continuous resource flow"
        ]
        return notes

def main():
    """Demo function to test resource calculation."""
    logger.info("🚀 Starting Resource Calculation System Demo")
    
    try:
        # Initialize system
        resource_system = ResourceCalculationSystem()
        
        # Test scenarios
        test_scenarios = [
            {
                'affected_population': 50000,
                'disaster_type': 'flood',
                'weather': {'rainfall': 150, 'wind_speed': 25, 'temperature': 28},
                'description': 'Medium flood in Dehradun'
            },
            {
                'affected_population': 25000,
                'disaster_type': 'earthquake',
                'weather': {'rainfall': 10, 'wind_speed': 15, 'temperature': 22},
                'description': 'Earthquake in Chamoli'
            },
            {
                'affected_population': 75000,
                'disaster_type': 'flash_flood',
                'weather': {'rainfall': 200, 'wind_speed': 45, 'temperature': 26},
                'description': 'Severe flash flood in Nainital'
            }
        ]
        
        for i, scenario in enumerate(test_scenarios, 1):
            print(f"\n{'='*70}")
            print(f"🧪 SCENARIO {i}: {scenario['description']}")
            print(f"{'='*70}")
            
            # Calculate resources
            resources = resource_system.calculate_resource_needs(
                scenario['affected_population'],
                scenario['disaster_type'],
                scenario['weather']
            )
            
            # Display results
            print(f"📍 Affected Population: {scenario['affected_population']:,}")
            print(f"🌊 Disaster Type: {scenario['disaster_type'].title()}")
            print(f"🌤️ Weather: {scenario['weather']}")
            print(f"\n📊 RESOURCE REQUIREMENTS:")
            
            for category, data in resources.items():
                if category == 'summary':
                    continue
                
                print(f"\n🔸 {category.upper()}:")
                print(f"   Base Amount: {data['base_amount']}")
                print(f"   Disaster Multiplier: {data['disaster_multiplier']:.2f}")
                print(f"   Weather Factor: {data['weather_factor']}")
                print(f"   Final Amount: {data['final_amount']}")
                print(f"   Description: {data['description']}")
            
            # Show summary
            summary = resources['summary']
            print(f"\n📋 DEPLOYMENT SUMMARY:")
            print(f"   Priority Resources: {len(summary['priority_resources'])} categories")
            print(f"   Deployment Strategy: {summary['deployment_strategy']}")
            print(f"   Coordination Notes: {len(summary['coordination_notes'])} items")
        
        print(f"\n✅ Resource calculation demo completed!")
        print("🚀 System ready for integration with ML predictions!")
        
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}")
        raise

if __name__ == "__main__":
    main()
