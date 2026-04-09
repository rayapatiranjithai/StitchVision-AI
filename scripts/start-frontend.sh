#!/bin/bash
set -e

cd "$(dirname "$0")/../frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "Starting Next.js frontend on http://localhost:3000"
echo ""

npm run dev
