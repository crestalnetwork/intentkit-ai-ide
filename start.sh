#!/bin/bash

echo "Starting IntentKit Portfolio & Token Test UI..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the development server
echo "Starting Next.js development server..."
npm run dev 