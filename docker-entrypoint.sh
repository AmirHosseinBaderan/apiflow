#!/bin/sh
set -e

# Start backend in background
cd /app/backend
node dist/server.js &
BACKEND_PID=$!

# Start nginx in foreground
nginx -g "daemon off;"
