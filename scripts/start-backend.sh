#!/bin/bash
set -e

cd "$(dirname "$0")/../backend"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt --quiet

echo ""
echo "Starting FastAPI backend on http://localhost:8002"
echo "API docs: http://localhost:8002/docs"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
