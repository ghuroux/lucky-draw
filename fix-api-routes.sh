#!/bin/bash

# Script to fix params.id issue in API routes
# Finds all route.ts files with params.id and replaces with proper awaited version

# Find all route.ts files using params.id
ROUTES=$(find app/api/events -name "route.ts" | xargs grep -l "params.id")

# Loop through each file and apply the fix
for file in $ROUTES; do
  echo "Fixing $file..."
  
  # Replace direct params.id access with proper awaited version
  sed -i '' -e 's/const eventId = \(Number\|parseInt\)(params.id);/const { id } = await params;\
  const eventId = \1(id);/g' $file
  
  # Replace prisma with db utility where needed
  sed -i '' -e 's/import { prisma } from .\/app\/lib\/prisma./import { db } from @\/app\/lib\/prisma-client/g' $file
  sed -i '' -e 's/await prisma\./await db\./g' $file
  
  echo "Fixed $file"
done

echo "All API routes fixed!" 