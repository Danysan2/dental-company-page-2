#!/bin/sh
set -e

echo "▶ Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "▶ Checking if seed is needed..."
node -e "
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.staff.count()
  .then(n => {
    if (n === 0) {
      console.log('DB is empty, seeding...')
      require('child_process').execSync('node prisma/seed.js', { stdio: 'inherit' })
    } else {
      console.log('DB already has data, skipping seed.')
    }
  })
  .finally(() => p.\$disconnect())
"

echo "▶ Starting server..."
exec node server.js
