#!/bin/bash
# Start both backend and frontend in parallel
set -e

SCRIPT_DIR="$(dirname "$0")"

echo "============================================"
echo "  Body Measurement AI - Starting Services"
echo "============================================"
echo ""

# Start backend in background
echo "[1/2] Starting backend..."
bash "$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 3

# Start frontend in background
echo "[2/2] Starting frontend..."
bash "$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "Services running:"
echo "  Backend:  http://localhost:8000 (API docs: http://localhost:8000/docs)"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Handle Ctrl+C to kill both
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both
wait
