#!/usr/bin/env bash
set -euo pipefail
export ML_HOST="${ML_HOST:-localhost}"
export ML_PORT="${ML_PORT:-5002}"
export PYTHONWARNINGS=ignore
python3 disaster_response_api.py
