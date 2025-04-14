#!/bin/bash

# Fix all Next.js warnings script
echo "🔧 Running Next.js warning fixes..."

# Make script executable
chmod +x fix-route-params.js
chmod +x fix-cookie-warnings.js

# Fix params warnings
echo "🔍 Fixing params warnings..."
node fix-route-params.js

# Fix cookie warnings
echo "🍪 Fixing cookie warnings..."
node fix-cookie-warnings.js

echo "✅ All fixes applied!"
echo "🚀 Please restart your development server with: npm run dev" 