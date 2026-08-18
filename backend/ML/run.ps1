$env:ML_HOST = if ($env:ML_HOST) { $env:ML_HOST } else { "localhost" }
$env:ML_PORT = if ($env:ML_PORT) { $env:ML_PORT } else { "5002" }
$env:PYTHONWARNINGS = "ignore"
python disaster_response_api.py
