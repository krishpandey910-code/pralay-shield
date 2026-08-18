# Quick Start Guide - Disaster Response Forecasting System

## 🚀 Getting Started

This guide will help you get up and running with the AI-Powered Disaster Response Forecasting System in under 10 minutes!

## 📋 Prerequisites

- Python 3.8 or higher
- pip package manager
- Basic knowledge of Python and machine learning

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
# Navigate to the ML folder
cd ML

# Install required packages
pip install -r requirements.txt
```

### 2. Prepare Your Data

Place your disaster response data in the `data/raw/` folder. Your data should include:
- **timestamp**: When the event occurred
- **latitude/longitude**: Geographic coordinates
- **disaster_type**: Type of disaster (earthquake, flood, hurricane, etc.)
- **severity**: Disaster severity level
- **demand**: Resource demand (target variable)

### 3. Run the Pipeline

```bash
# Run the complete pipeline
python main_pipeline.py --data-file data/raw/your_data.csv --run-full-pipeline

# Or run individual components
python main_pipeline.py --data-file data/raw/your_data.csv
```

## 🔧 Configuration

Edit `config/config.yaml` to customize:
- Model algorithms
- Training parameters
- Geographic settings
- Performance thresholds

## 📊 What You'll Get

After running the pipeline, you'll have:
- ✅ **Cleaned and processed data** in `data/processed/`
- ✅ **Trained ML models** in `models/`
- ✅ **Performance reports** in `data/output/`
- ✅ **Predictions and recommendations** for resource allocation

## 🎯 Key Features

- **Demand Forecasting**: Predict resource needs in high-demand areas
- **Resource Optimization**: Optimize allocation of emergency resources
- **Anomaly Detection**: Identify unusual patterns in disaster data
- **Geographic Analysis**: Spatial analysis and heatmap generation
- **Performance Monitoring**: Comprehensive model evaluation

## 📚 Explore Further

- **Data Exploration**: Check out `notebooks/01_data_exploration.ipynb`
- **Custom Models**: Modify `src/training/train_models.py`
- **Evaluation**: Use `src/evaluation/evaluate_models.py`
- **Predictions**: Leverage `src/prediction/predictor.py`

## 🆘 Need Help?

1. Check the logs in `logs/` directory
2. Review the configuration in `config/config.yaml`
3. Run tests: `python -m pytest tests/`
4. Check the comprehensive README.md

## 🎉 Success!

You're now ready to predict disaster response demands and optimize resource allocation using AI!

---

*For detailed documentation, see README.md*
