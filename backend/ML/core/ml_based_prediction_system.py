#!/usr/bin/env python3
"""Population impact prediction using a trained model."""

import pandas as pd
import joblib
import logging
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MLBasedDisasterPredictionSystem:
    """ML-based disaster prediction system using trained model."""
    
    def __init__(self):
        """Initialize the ML-based prediction system."""
        self.district_populations = self._load_district_populations()
        self.disaster_impact_factors = self._load_disaster_impact_factors()
        # Load city-to-district map from CSV and merge with built-ins
        self.location_aliases = self._load_city_map()
        self.load_trained_model()

    def _normalize_location(self, location: str) -> str:
        """Resolve user-provided city/town to a known district name.
        Returns a district in self.district_populations or raises ValueError.
        """
        if not location:
            raise ValueError("Location is required")
        # Trim and title-case words
        loc = " ".join(w for w in str(location).strip().split())
        # Direct district match (case-insensitive)
        for district in self.district_populations.keys():
            if loc.lower() == district.lower():
                return district
        # Alias/city mapping
        # Try exact alias key (case-insensitive)
        for alias, district in self.location_aliases.items():
            if loc.lower() == alias.lower():
                return district
        # Soft contains match: if alias contained in input or vice versa
        for alias, district in self.location_aliases.items():
            al = alias.lower()
            ll = loc.lower()
            if al in ll or ll in al:
                return district
        # Last try: partial match against districts (e.g., 'Pauri' → 'Pauri Garhwal')
        for district in self.district_populations.keys():
            if loc.lower() in district.lower():
                return district
        # Not resolvable
        raise ValueError(f"Unknown location: {location}")

    def _load_city_map(self) -> dict:
        """Load city→district mapping from CSV and merge with defaults."""
        # Defaults (kept minimal; extended via CSV)
        aliases = {
            'Haldwani': 'Nainital',
            'Nanital': 'Nainital',  # common typo
            'Rishikesh': 'Dehradun',
            'Mussoorie': 'Dehradun'
        }
        try:
            csv_path = Path('backend/ML/data/processed/city_to_district.csv')
            if csv_path.exists():
                df = pd.read_csv(csv_path)
                for _, row in df.iterrows():
                    city = str(row['city']).strip()
                    dist = str(row['district']).strip()
                    if city and dist:
                        aliases[city] = dist
        except Exception as e:
            logger.warning(f"City map load failed, using defaults only: {e}")
        return aliases
        
    def _load_district_populations(self):
        """Load district populations from CSV."""
        try:
            csv_path = Path('backend/ML/data/processed/district_population.csv')
            df = pd.read_csv(csv_path)
            return {str(r['district']).strip(): int(r['population']) for _, r in df.iterrows()}
        except Exception as e:
            logger.error(f"Failed to load district populations: {e}")
            raise
    
    def _load_disaster_impact_factors(self):
        """Load impact presets from CSV."""
        try:
            csv_path = Path('backend/ML/data/processed/disaster_impact_factors.csv')
            df = pd.read_csv(csv_path)
            factors = {}
            for _, r in df.iterrows():
                t = str(r['disaster_type']).strip().lower()
                factors[t] = {
                    'default_affected_area': float(r['default_affected_area']),
                    'altitude_zone': str(r['altitude_zone']).strip(),
                    'zone_type': str(r['zone_type']).strip(),
                    'description': str(r.get('description', '')).strip()
                }
            return factors
        except Exception as e:
            logger.error(f"Failed to load impact factors: {e}")
            raise
    
    def load_trained_model(self):
        """Load the trained ML model and encoders."""
        try:
            models_dir = Path("models")
            
            # Load model
            self.model = joblib.load(models_dir / "population_estimate_model_gradientboosting.joblib")
            
            # Load encoders
            self.encoders = joblib.load(models_dir / "population_estimate_encoders.joblib")
            
            # Load scaler
            self.scaler = joblib.load(models_dir / "population_estimate_scaler.joblib")
            
            logger.info("✅ Trained ML model loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load trained model: {e}")
            raise
    
    def get_weather_data(self, location):
        """Random weather sample (placeholder)."""
        import random
        
        current_weather = {
            'temperature': random.uniform(20, 35),
            'rainfall': random.uniform(0, 300),
            'humidity': random.uniform(40, 95),
            'wind_speed': random.uniform(0, 60)
        }
        
        return current_weather
    
    def _calculate_weather_factors(self, weather):
        """Compute weather factors."""
        # Calculate rainfall factor
        rainfall = weather['rainfall']
        if rainfall <= 10:
            rainfall_factor = 1.0
        elif rainfall <= 25:
            rainfall_factor = 1.05
        elif rainfall <= 50:
            rainfall_factor = 1.10
        elif rainfall <= 100:
            rainfall_factor = 1.15
        elif rainfall <= 200:
            rainfall_factor = 1.25
        else:
            rainfall_factor = 1.35
        
        # Calculate wind factor
        wind_speed = weather['wind_speed']
        if wind_speed <= 10:
            wind_factor = 1.0
        elif wind_speed <= 20:
            wind_factor = 1.03
        elif wind_speed <= 30:
            wind_factor = 1.08
        elif wind_speed <= 50:
            wind_factor = 1.15
        else:
            wind_factor = 1.25
        
        # Calculate humidity factor
        humidity = weather['humidity']
        if humidity <= 60:
            humidity_factor = 1.0
        elif humidity <= 80:
            humidity_factor = 1.02
        elif humidity <= 90:
            humidity_factor = 1.05
        else:
            humidity_factor = 1.08
        
        # Calculate temperature factor
        temperature = weather['temperature']
        if 15 <= temperature <= 30:
            temperature_factor = 1.0
        elif temperature < 15:
            temperature_factor = 1.05
        else:
            temperature_factor = 1.03
        
        # Combined weather factor
        weather_factor = (rainfall_factor * wind_factor * humidity_factor * temperature_factor) ** 0.25
        
        return {
            'rainfall_factor': rainfall_factor,
            'wind_factor': wind_factor,
            'humidity_factor': humidity_factor,
            'temperature_factor': temperature_factor,
            'weather_factor': weather_factor
        }
    
    def predict_disaster_impact(self, location, disaster_type, affected_area_percent=None):
        """Return prediction dict for given inputs."""
        try:
            # Normalize and validate location to a known district
            location_normalized = self._normalize_location(location)
            
            disaster_type = disaster_type.lower()
            if disaster_type not in self.disaster_impact_factors:
                raise ValueError(f"Unknown disaster type: {disaster_type}")
            
            # Get district population
            district_population = self.district_populations[location_normalized]
            
            # Get affected area percentage
            if affected_area_percent is None:
                affected_area_percent = self.disaster_impact_factors[disaster_type]['default_affected_area'] * 100
            
            # Get current weather data
            current_weather = self.get_weather_data(location_normalized)
            
            # Calculate weather factors
            weather_factors = self._calculate_weather_factors(current_weather)
            
            # Prepare features for ML model
            features = self._prepare_ml_features(
                location_normalized, disaster_type, district_population, 
                affected_area_percent, current_weather, weather_factors
            )
            
            # Make prediction using trained ML model
            final_affected = self.model.predict([features])[0]
            
            # Ensure prediction is reasonable
            final_affected = max(0, int(final_affected))
            
            # Calculate base affected (for comparison)
            base_affected = district_population * (affected_area_percent / 100)
            
            result = {
                'location': location_normalized,
                'disaster_type': disaster_type,
                'district_population': district_population,
                'affected_area_percent': affected_area_percent,
                'base_affected': int(base_affected),
                'final_affected': final_affected,
                'current_weather': current_weather,
                'weather_factors': weather_factors,
                'disaster_description': self.disaster_impact_factors[disaster_type]['description'],
                'model_confidence': 'High',
                'original_input_location': location
            }
            
            logger.info(f"ML prediction completed for {location}: {final_affected:,.0f} people affected")
            return result
            
        except Exception as e:
            logger.error(f"Error in ML prediction: {e}")
            raise
    
    def _prepare_ml_features(self, location, disaster_type, district_population, 
                           affected_area_percent, weather, weather_factors):
        """Prepare features for ML model prediction."""
        
        disaster_info = self.disaster_impact_factors[disaster_type]
        
        # Create feature vector (same order as training)
        features = [
            district_population,  # DistrictPopulation
            affected_area_percent,  # AffectedAreaPercent
            weather['temperature'],  # Temperature
            weather['rainfall'],  # Rainfall
            weather['humidity'],  # Humidity
            weather['wind_speed'],  # WindSpeed
            weather_factors['rainfall_factor'],  # RainfallFactor
            weather_factors['wind_factor'],  # WindFactor
            weather_factors['humidity_factor'],  # HumidityFactor
            weather_factors['temperature_factor'],  # TemperatureFactor
            weather_factors['weather_factor'],  # WeatherFactor
            1,  # DurationDays (default)
            6,  # Month (default - monsoon season)
        ]
        
        # Add encoded categorical features
        # District_encoded
        district_encoded = self.encoders['District'].transform([location])[0]
        features.append(district_encoded)
        
        # EventType_encoded
        # Map disaster types to match training data format
        event_type_mapping = {
            'flash_flood': 'Flash Flood',
            'flood': 'Flood',
            'landslide': 'Landslide',
            'earthquake': 'Earthquake',
            'cloudburst': 'Cloudburst',
            'avalanche': 'Avalanche'
        }
        event_type_for_encoding = event_type_mapping.get(disaster_type, disaster_type.title())
        event_type_encoded = self.encoders['EventType'].transform([event_type_for_encoding])[0]
        features.append(event_type_encoded)
        
        # AltitudeZone_encoded
        altitude_zone = disaster_info['altitude_zone']
        altitude_encoded = self.encoders['AltitudeZone'].transform([altitude_zone])[0]
        features.append(altitude_encoded)
        
        # ZoneType_encoded
        zone_type = disaster_info['zone_type']
        zone_encoded = self.encoders['ZoneType'].transform([zone_type])[0]
        features.append(zone_encoded)
        
        return features
    
    # Demo/summary helpers removed for brevity