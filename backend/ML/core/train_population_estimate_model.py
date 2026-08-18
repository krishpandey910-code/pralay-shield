#!/usr/bin/env python3
"""
Train ML model for final population estimate prediction
Based on disaster type, location, affected area, and weather factors
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import logging
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PopulationEstimateTrainer:
    """Train ML model for population estimate prediction."""
    
    def __init__(self):
        """Initialize the trainer."""
        self.district_populations = self._load_district_populations()
        self.models = {}
        self.encoders = {}
        self.scaler = StandardScaler()
        
    def _load_district_populations(self):
        """Load district-wise population data."""
        return {
            'Dehradun': 1696694,
            'Haridwar': 1890427,
            'Nainital': 954605,
            'Almora': 621927,
            'Pithoragarh': 483439,
            'Chamoli': 391605,
            'Rudraprayag': 242285,
            'Tehri Garhwal': 618931,
            'Uttarkashi': 330086,
            'Bageshwar': 259898,
            'Champawat': 259315,
            'Udham Singh Nagar': 1648908,
            'Pauri Garhwal': 687271
        }
    
    def load_and_prepare_data(self):
        """Load and prepare training data."""
        logger.info("Loading Uttarakhand disaster data...")
        
        # Load the disaster data
        data_path = "data/raw/uttarakhand_synthetic_disaster_2010_2025.csv"
        data = pd.read_csv(data_path)
        
        logger.info(f"Loaded {len(data)} disaster events")
        
        # Add district population
        data['DistrictPopulation'] = data['District'].map(self.district_populations)
        
        # Calculate affected area percentage
        data['AffectedAreaPercent'] = (data['AffectedPopulation'] / data['DistrictPopulation']) * 100
        
        # Add simulated weather factors (in real system, this would come from weather API)
        np.random.seed(42)  # For reproducibility
        data['Temperature'] = np.random.uniform(15, 35, len(data))
        data['Humidity'] = np.random.uniform(40, 95, len(data))
        data['WindSpeed'] = np.random.uniform(0, 60, len(data))
        
        # Use existing Rainfall_mm as rainfall data
        data['Rainfall'] = data['Rainfall_mm']
        
        # Calculate weather factors
        data['RainfallFactor'] = data['Rainfall'].apply(self._calculate_rainfall_factor)
        data['WindFactor'] = data['WindSpeed'].apply(self._calculate_wind_factor)
        data['HumidityFactor'] = data['Humidity'].apply(self._calculate_humidity_factor)
        data['TemperatureFactor'] = data['Temperature'].apply(self._calculate_temperature_factor)
        
        # Combined weather factor
        data['WeatherFactor'] = (data['RainfallFactor'] * data['WindFactor'] * 
                                data['HumidityFactor'] * data['TemperatureFactor']) ** 0.25
        
        # Calculate base affected (without weather factors)
        data['BaseAffected'] = data['AffectedPopulation'] / data['WeatherFactor']
        
        # Target variable (AffectedPopulation with weather impact)
        data['FinalAffected'] = data['AffectedPopulation']
        
        logger.info("Data preparation completed")
        return data
    
    def _calculate_rainfall_factor(self, rainfall_mm):
        """Calculate rainfall impact factor."""
        if rainfall_mm <= 10:
            return 1.0
        elif rainfall_mm <= 25:
            return 1.05
        elif rainfall_mm <= 50:
            return 1.10
        elif rainfall_mm <= 100:
            return 1.15
        elif rainfall_mm <= 200:
            return 1.25
        else:
            return 1.35
    
    def _calculate_wind_factor(self, wind_speed_kmh):
        """Calculate wind impact factor."""
        if wind_speed_kmh <= 10:
            return 1.0
        elif wind_speed_kmh <= 20:
            return 1.03
        elif wind_speed_kmh <= 30:
            return 1.08
        elif wind_speed_kmh <= 50:
            return 1.15
        else:
            return 1.25
    
    def _calculate_humidity_factor(self, humidity_percent):
        """Calculate humidity impact factor."""
        if humidity_percent <= 60:
            return 1.0
        elif humidity_percent <= 80:
            return 1.02
        elif humidity_percent <= 90:
            return 1.05
        else:
            return 1.08
    
    def _calculate_temperature_factor(self, temperature_celsius):
        """Calculate temperature impact factor."""
        if 15 <= temperature_celsius <= 30:
            return 1.0
        elif temperature_celsius < 15:
            return 1.05
        else:
            return 1.03
    
    def prepare_features(self, data):
        """Prepare features for training."""
        logger.info("Preparing features for training...")
        
        # Select features
        feature_columns = [
            'District', 'EventType', 'AltitudeZone', 'ZoneType',
            'DistrictPopulation', 'AffectedAreaPercent',
            'Temperature', 'Rainfall', 'Humidity', 'WindSpeed',
            'RainfallFactor', 'WindFactor', 'HumidityFactor', 'TemperatureFactor',
            'WeatherFactor', 'DurationDays', 'Month'
        ]
        
        # Create feature DataFrame
        features = data[feature_columns].copy()
        
        # Encode categorical variables
        categorical_columns = ['District', 'EventType', 'AltitudeZone', 'ZoneType']
        
        for col in categorical_columns:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
                features[f'{col}_encoded'] = self.encoders[col].fit_transform(features[col])
            else:
                features[f'{col}_encoded'] = self.encoders[col].transform(features[col])
        
        # Drop original categorical columns
        features = features.drop(columns=categorical_columns)
        
        # Target variable
        target = data['FinalAffected']
        
        logger.info(f"Prepared {len(features.columns)} features: {list(features.columns)}")
        return features, target
    
    def train_models(self, X, y):
        """Train multiple ML models."""
        logger.info("Training ML models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Define models
        models_to_train = {
            'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
            'GradientBoosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
        }
        
        # Train models
        results = {}
        
        for name, model in models_to_train.items():
            logger.info(f"Training {name}...")
            
            if name in ['RandomForest', 'GradientBoosting']:
                # Tree-based models don't need scaling
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
            else:
                # Other models need scaling
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            results[name] = {
                'model': model,
                'mse': mse,
                'rmse': rmse,
                'mae': mae,
                'r2': r2,
                'y_test': y_test,
                'y_pred': y_pred
            }
            
            logger.info(f"{name} - RMSE: {rmse:.2f}, MAE: {mae:.2f}, R²: {r2:.4f}")
        
        # Select best model based on R² score
        best_model_name = max(results.keys(), key=lambda k: results[k]['r2'])
        best_model = results[best_model_name]['model']
        
        logger.info(f"Best model: {best_model_name} (R² = {results[best_model_name]['r2']:.4f})")
        
        self.models['best_model'] = best_model
        self.models['best_model_name'] = best_model_name
        self.models['all_results'] = results
        
        return results
    
    def save_models(self):
        """Save trained models and encoders."""
        logger.info("Saving trained models...")
        
        # Create models directory
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        
        # Save best model
        model_filename = f"population_estimate_model_{self.models['best_model_name'].lower()}.joblib"
        joblib.dump(self.models['best_model'], models_dir / model_filename)
        
        # Save encoders
        encoders_filename = "population_estimate_encoders.joblib"
        joblib.dump(self.encoders, models_dir / encoders_filename)
        
        # Save scaler
        scaler_filename = "population_estimate_scaler.joblib"
        joblib.dump(self.scaler, models_dir / scaler_filename)
        
        logger.info(f"Models saved: {model_filename}")
        logger.info(f"Encoders saved: {encoders_filename}")
        logger.info(f"Scaler saved: {scaler_filename}")
        
        return model_filename, encoders_filename, scaler_filename
    
    def plot_results(self):
        """Plot training results."""
        results = self.models['all_results']
        
        fig, axes = plt.subplots(1, 2, figsize=(15, 6))
        
        # Plot 1: Model comparison
        model_names = list(results.keys())
        r2_scores = [results[name]['r2'] for name in model_names]
        rmse_scores = [results[name]['rmse'] for name in model_names]
        
        axes[0].bar(model_names, r2_scores)
        axes[0].set_title('Model R² Comparison')
        axes[0].set_ylabel('R² Score')
        axes[0].set_ylim(0, 1)
        
        # Plot 2: Predictions vs Actual (best model)
        best_name = self.models['best_model_name']
        y_test = results[best_name]['y_test']
        y_pred = results[best_name]['y_pred']
        
        axes[1].scatter(y_test, y_pred, alpha=0.6)
        axes[1].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
        axes[1].set_xlabel('Actual')
        axes[1].set_ylabel('Predicted')
        axes[1].set_title(f'{best_name} - Predictions vs Actual')
        
        plt.tight_layout()
        plt.savefig('models/population_estimate_training_results.png')
        logger.info("Training results plot saved: models/population_estimate_training_results.png")
        
    def generate_summary(self):
        """Generate training summary."""
        results = self.models['all_results']
        best_name = self.models['best_model_name']
        
        summary = f"""
🚀 POPULATION ESTIMATE MODEL TRAINING SUMMARY
===============================================

📊 TRAINING RESULTS:
"""
        
        for name, result in results.items():
            marker = "⭐" if name == best_name else "•"
            summary += f"""
{marker} {name}:
   - RMSE: {result['rmse']:,.2f}
   - MAE: {result['mae']:,.2f}
   - R² Score: {result['r2']:.4f}
"""
        
        summary += f"""
🏆 BEST MODEL: {best_name}
📊 Performance: R² = {results[best_name]['r2']:.4f}

💾 SAVED FILES:
• Model: population_estimate_model_{best_name.lower()}.joblib
• Encoders: population_estimate_encoders.joblib  
• Scaler: population_estimate_scaler.joblib
• Results: population_estimate_training_results.png

🚀 READY FOR INTEGRATION:
The model can now predict final affected population based on:
• District location
• Disaster type
• Affected area percentage
• Current weather conditions

✅ Next: Integrate this model into your prediction system!
"""
        
        return summary

def main():
    """Main training function."""
    logger.info("🚀 Starting Population Estimate Model Training")
    
    try:
        # Initialize trainer
        trainer = PopulationEstimateTrainer()
        
        # Load and prepare data
        data = trainer.load_and_prepare_data()
        
        # Prepare features
        X, y = trainer.prepare_features(data)
        
        # Train models
        results = trainer.train_models(X, y)
        
        # Save models
        trainer.save_models()
        
        # Plot results
        trainer.plot_results()
        
        # Generate summary
        summary = trainer.generate_summary()
        print(summary)
        
        logger.info("✅ Training completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        raise

if __name__ == "__main__":
    main()
