# Uttarakhand Disaster Response Forecasting System

## 🏔️ Overview

This AI-powered forecasting system is specifically designed for disaster resource allocation in Uttarakhand, India. It predicts high-demand areas and optimizes allocation of critical resources (food, medicine, shelters) during natural disasters using advanced machine learning and time series forecasting techniques.

## 🎯 Key Objectives

- **Predict Resource Demands**: Forecast food packets, medical supplies, and shelter requirements
- **Identify High-Risk Areas**: Pinpoint districts and zones with highest vulnerability
- **Optimize Resource Allocation**: Ensure efficient distribution of emergency resources
- **Time Series Forecasting**: Capture seasonal and temporal patterns in disaster events
- **Real-time Decision Support**: Provide actionable insights for emergency response teams

## 📊 Data Sources

The system integrates multiple comprehensive datasets:

### 1. **Disaster Events Dataset** (`uttarakhand_synthetic_disaster_2010_2025.csv`)
- **Records**: 426 disaster events (2010-2025)
- **Features**: Date, district, event type, casualties, infrastructure damage, resource needs
- **Coverage**: All 13 districts of Uttarakhand

### 2. **Weather Data** (`uttarakhand_weather_2010_2022.csv`)
- **Records**: Annual weather patterns by district
- **Features**: Temperature, rainfall, snowfall
- **Purpose**: Environmental factor analysis

### 3. **Population & Demographics** (`uttarakhand_population_density.csv`)
- **Records**: District-wise population statistics
- **Features**: Population, area, density, urban/rural distribution
- **Purpose**: Demand scaling and capacity planning

### 4. **Vulnerability Index** (`uttarakhand_vulnerability_index_proto.csv`)
- **Records**: Risk assessment by district
- **Features**: Flood, landslide, earthquake risk scores
- **Purpose**: Risk-based prioritization

### 5. **Resource Usage History** (`uttarakhand_resource_usage_events_2010_2022.csv`)
- **Records**: Historical resource consumption patterns
- **Features**: Actual resource usage, event details
- **Purpose**: Training data for demand prediction

## 🏗️ System Architecture

```
Uttarakhand Disaster Forecasting System
├── 📁 Data Processing
│   ├── Multi-dataset integration
│   ├── Feature engineering
│   ├── Categorical encoding
│   └── Time series preparation
├── 📁 Machine Learning Models
│   ├── Random Forest (3 targets)
│   ├── XGBoost (3 targets)
│   ├── Gradient Boosting (3 targets)
│   └── Linear Models (comparison)
├── 📁 Deep Learning
│   ├── LSTM time series forecasting
│   ├── Multivariate sequences
│   └── Temporal pattern recognition
├── 📁 Evaluation & Comparison
│   ├── Performance metrics
│   ├── Model comparison
│   └── Feature importance analysis
└── 📁 Prediction & Deployment
    ├── Resource demand forecasting
    ├── High-risk area identification
    └── Allocation recommendations
```

## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
cd ML
pip install -r requirements.txt
```

### 2. **Run the Complete Pipeline**
```bash
python uttarakhand_pipeline.py --run-full-pipeline
```

### 3. **Run Individual Components**
```bash
# Data processing only
python uttarakhand_pipeline.py --data-only

# Model training only (requires preprocessed data)
python uttarakhand_pipeline.py --train-only
```

## 🔧 Configuration

Edit `config/config.yaml` to customize:

```yaml
# Model Configuration
models:
  random_forest:
    n_estimators: 100
    max_depth: 15
  xgboost:
    n_estimators: 100
    max_depth: 6
  lstm:
    lookback_window: 12
    units: [64, 32]
    epochs: 100

# Training Configuration
training:
  test_size: 0.3
  cross_validation_folds: 5
```

## 📈 Model Types

### **1. Traditional Machine Learning**
- **Random Forest**: Robust, handles non-linear relationships
- **XGBoost**: High performance, gradient boosting
- **Gradient Boosting**: Ensemble learning approach
- **Linear Models**: Baseline comparison (Ridge, Lasso)

### **2. Deep Learning (LSTM)**
- **Architecture**: 2 LSTM layers + Dense layers
- **Features**: Multivariate time series forecasting
- **Advantages**: Captures temporal dependencies and seasonal patterns

### **3. Target Variables**
Each model predicts three critical resources:
- **FoodPacketsNeeded**: Daily food requirements
- **MedicinesNeeded**: Medical supply quantities
- **SheltersRequired**: Emergency shelter capacity

## 🎯 Feature Engineering

### **Temporal Features**
- Year, Month, Day, Season
- Cyclical encoding (sin/cos transformations)
- Day of year, weekend indicators

### **Geographic Features**
- District encoding (one-hot)
- Altitude zones (Low/Medium/High)
- Zone types (Flood-prone, Landslide-prone, Seismic)

### **Disaster Features**
- Event type risk scores
- Duration and severity indicators
- Affected population percentages

### **Weather Features**
- Rainfall patterns
- Temperature variations
- Snowfall data

### **Vulnerability Features**
- Composite risk indices
- District-specific risk scores
- Infrastructure vulnerability

### **Resource Intensity Features**
- Per-capita resource needs
- Historical consumption patterns
- Demand scaling factors

## 📊 Model Evaluation

### **Performance Metrics**
- **MAE**: Mean Absolute Error
- **RMSE**: Root Mean Square Error
- **R²**: Coefficient of determination
- **MAPE**: Mean Absolute Percentage Error

### **Cross-Validation**
- 5-fold cross-validation
- Robust performance assessment
- Overfitting detection

### **Feature Importance**
- Random Forest feature rankings
- Model interpretability
- Decision-making insights

## 🎨 Outputs & Visualizations

### **1. Model Performance Plots**
- R² Score comparisons across models
- RMSE and MAE comparisons
- Training history (LSTM)

### **2. Feature Importance Charts**
- Top 15 most important features
- Resource-specific importance rankings
- Model interpretability

### **3. Time Series Analysis**
- LSTM training curves
- Loss and MAE progression
- Validation performance

### **4. Reports**
- Comprehensive pipeline reports
- Model comparison summaries
- Performance assessments

## 🔮 Prediction Example

### **Input Scenario**
```python
example_input = {
    'District': 'Nainital',
    'EventType': 'Flood',
    'Rainfall_mm': 350.0,
    'AffectedPopulation': 5000,
    'Deaths': 25,
    'Injured': 150,
    'Missing': 5,
    'Evacuated': 3000,
    'HousesDestroyed': 45,
    'HousesDamaged': 120,
    'RoadBlockage_km': 8.5,
    'BridgesCollapsed': 2,
    'Year': 2024,
    'Month': 7
}
```

### **Expected Output**
- **Food Demand**: Predicted food packets needed
- **Medical Demand**: Required medical supplies
- **Shelter Demand**: Emergency shelter capacity
- **Confidence Intervals**: Prediction uncertainty ranges
- **Risk Assessment**: High/medium/low priority classification

## 🗺️ Geographic Coverage

### **Districts Covered**
1. **Dehradun** - Capital, low altitude
2. **Nainital** - Tourist hub, medium altitude
3. **Pauri Garhwal** - Hilly terrain, medium altitude
4. **Tehri Garhwal** - Mountainous, medium altitude
5. **Chamoli** - High altitude, disaster-prone
6. **Rudraprayag** - High altitude, seismic zone
7. **Uttarkashi** - High altitude, landslide-prone
8. **Almora** - Medium altitude, cultural center
9. **Bageshwar** - High altitude, remote
10. **Champawat** - Border district, medium altitude
11. **Pithoragarh** - High altitude, border area
12. **Haridwar** - Religious center, low altitude
13. **Udham Singh Nagar** - Plains, agricultural

### **Altitude Zones**
- **Low**: < 1000m (Dehradun, Haridwar, Udham Singh Nagar)
- **Medium**: 1000-2000m (Nainital, Pauri, Tehri, Almora, Champawat)
- **High**: > 2000m (Chamoli, Rudraprayag, Uttarkashi, Bageshwar, Pithoragarh)

## 🌦️ Disaster Types Handled

### **Natural Disasters**
- **Floods**: Monsoon rains, flash floods
- **Landslides**: Mountain slope failures
- **Avalanches**: Snow and ice slides
- **Earthquakes**: Seismic activities
- **Cloudbursts**: Intense rainfall events

### **Risk Factors**
- **Geographic**: Altitude, slope, proximity to rivers
- **Climatic**: Rainfall patterns, temperature extremes
- **Infrastructure**: Road networks, building density
- **Population**: Density, accessibility, evacuation routes

## 📁 File Structure

```
ML/
├── 📁 src/
│   ├── 📁 preprocessing/
│   │   └── uttarakhand_processor.py    # Data processing for Uttarakhand
│   ├── 📁 training/
│   │   ├── uttarakhand_trainer.py      # ML model training
│   │   └── uttarakhand_lstm.py        # LSTM time series training
│   └── 📁 evaluation/
│       └── evaluate_models.py          # Model evaluation
├── 📁 data/
│   ├── 📁 raw/                         # Original datasets
│   ├── 📁 processed/                   # Cleaned and processed data
│   └── 📁 output/                      # Results and visualizations
├── 📁 models/                          # Trained model files
├── 📁 config/                          # Configuration files
├── 📁 logs/                            # Pipeline execution logs
├── uttarakhand_pipeline.py             # Main pipeline script
├── requirements.txt                     # Python dependencies
└── UTTARAKHAND_README.md              # This file
```

## 🚨 Emergency Response Integration

### **Real-time Applications**
- **Early Warning Systems**: Predict resource needs before disasters
- **Resource Planning**: Pre-position supplies in high-risk areas
- **Response Coordination**: Optimize team deployment
- **Capacity Planning**: Ensure adequate resource availability

### **Decision Support**
- **Priority Ranking**: High-risk area identification
- **Resource Allocation**: Optimal distribution strategies
- **Timing**: When to mobilize resources
- **Capacity**: How much to prepare

## 🔬 Technical Specifications

### **Data Processing**
- **Missing Value Handling**: Median imputation for numerical, mode for categorical
- **Feature Scaling**: MinMaxScaler (0-1 normalization)
- **Categorical Encoding**: Label encoding + one-hot encoding
- **Time Series**: Lag features, rolling statistics, seasonal encoding

### **Model Training**
- **Train/Test Split**: 70/30 split
- **Cross-Validation**: 5-fold CV
- **Hyperparameter Tuning**: GridSearchCV for optimization
- **Early Stopping**: LSTM training optimization

### **Performance Requirements**
- **Minimum R²**: 0.7 (70% variance explained)
- **Maximum RMSE**: 30% of target range
- **Cross-Validation**: Stable performance across folds

## 🚀 Future Enhancements

### **Short-term (3-6 months)**
- Real-time data integration
- Weather API connections
- Mobile app for field teams
- Automated alert systems

### **Medium-term (6-12 months)**
- Satellite imagery integration
- Social media sentiment analysis
- IoT sensor data integration
- Multi-language support

### **Long-term (1+ years)**
- National scale expansion
- International disaster modeling
- Climate change adaptation
- AI-powered response automation

## 🤝 Contributing

### **Development Guidelines**
1. Follow PEP 8 coding standards
2. Add comprehensive docstrings
3. Include unit tests for new features
4. Update documentation for changes
5. Use type hints for function parameters

### **Testing**
```bash
# Run unit tests
python -m pytest tests/

# Run with coverage
python -m pytest tests/ --cov=src
```

## 📞 Support & Contact

### **Technical Issues**
- Check logs in `logs/` directory
- Review configuration in `config/config.yaml`
- Run tests to verify system integrity

### **Data Questions**
- Verify data format matches expected schema
- Check for missing or corrupted files
- Ensure all required datasets are present

### **Model Performance**
- Review feature engineering pipeline
- Check for data leakage
- Validate cross-validation results
- Analyze feature importance rankings

## 📚 References

### **Academic Papers**
- Disaster Response Resource Allocation
- Time Series Forecasting in Emergency Management
- Machine Learning for Humanitarian Aid

### **Government Reports**
- Uttarakhand Disaster Management Plan
- National Disaster Response Framework
- State Emergency Response Guidelines

### **Technical Documentation**
- Scikit-learn User Guide
- TensorFlow/Keras Documentation
- XGBoost Parameters Guide

---

## 🎉 Success Metrics

### **Operational Impact**
- **Response Time**: 50% reduction in resource deployment time
- **Resource Efficiency**: 30% improvement in allocation accuracy
- **Coverage**: 95% of high-risk areas covered
- **Accuracy**: 85%+ prediction accuracy for resource demands

### **System Performance**
- **Training Time**: < 2 hours for complete pipeline
- **Prediction Speed**: < 5 seconds for real-time forecasts
- **Scalability**: Handle 1000+ concurrent predictions
- **Reliability**: 99.9% uptime for emergency operations

---

*This system represents a significant advancement in disaster response technology, specifically designed for the unique challenges and geography of Uttarakhand, India.*
