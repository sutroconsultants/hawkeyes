#!/bin/bash
set -e

echo "=== Hawkeyes Startup ==="

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Wait for ClickHouse to be ready
echo "Waiting for ClickHouse..."
until curl -s http://clickhouse:8123/ping > /dev/null 2>&1; do
  sleep 1
done
echo "ClickHouse is ready!"

# Start the development server
echo "Starting Next.js development server..."
exec npm run dev -- --hostname 0.0.0.0 --port 7900
