#!/bin/sh
set -e

echo "▶ Applying DB schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss

echo "▶ Running seed..."
node prisma/seed.js

echo "▶ Starting server..."
exec node server.js
