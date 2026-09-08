#!/bin/sh
set -e
echo "Running database migrations..."
cd apps/backend && npx prisma db push --accept-data-loss
echo "Starting server..."
cd /app && npx tsx apps/backend/src/index.ts