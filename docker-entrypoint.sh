#!/bin/sh

echo "▶ Applying DB schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss || echo "⚠ Schema push failed — server will start anyway"

echo "▶ Running seed..."
node prisma/seed.js || echo "⚠ Seed failed — server will start anyway"

echo "▶ Starting server..."
exec node server.js
