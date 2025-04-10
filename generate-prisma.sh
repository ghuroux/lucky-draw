#!/bin/bash

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Updating prisma client caches..."
find node_modules/.prisma -type d -name "client" -exec touch {}/*.js \;

echo "Done!" 