#!/bin/bash
echo "Auditing authentication usage across the codebase..."
echo ""

# Define colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check for deprecated imports
echo "${YELLOW}Checking for deprecated imports...${NC}"

UTILS_AUTH_COUNT=$(grep -r "from '@/app/utils/auth'" app --include="*.ts" --include="*.tsx" | wc -l)
UTILS_AUTH_CLIENT_COUNT=$(grep -r "from '@/app/utils/auth-client'" app --include="*.ts" --include="*.tsx" | wc -l)

if [ $UTILS_AUTH_COUNT -gt 0 ]; then
  echo "${RED}Found $UTILS_AUTH_COUNT files still using '@/app/utils/auth' (deprecated):${NC}"
  grep -r "from '@/app/utils/auth'" app --include="*.ts" --include="*.tsx" | awk -F ":" '{print $1}'
  echo ""
else
  echo "${GREEN}No files using '@/app/utils/auth' (good)${NC}"
  echo ""
fi

if [ $UTILS_AUTH_CLIENT_COUNT -gt 0 ]; then
  echo "${RED}Found $UTILS_AUTH_CLIENT_COUNT files still using '@/app/utils/auth-client' (deprecated):${NC}"
  grep -r "from '@/app/utils/auth-client'" app --include="*.ts" --include="*.tsx" | awk -F ":" '{print $1}'
  echo ""
else
  echo "${GREEN}No files using '@/app/utils/auth-client' (good)${NC}"
  echo ""
fi

# Check for client-side auth in server components
echo "${YELLOW}Checking for client-side auth in server components...${NC}"
SERVER_WITH_CLIENT_AUTH=$(grep -r "from '@/app/lib/auth'" app --include="*.ts" --exclude="**/page.tsx" --exclude="**/components/**" --exclude="**/hooks/**" | wc -l)

if [ $SERVER_WITH_CLIENT_AUTH -gt 0 ]; then
  echo "${RED}Found $SERVER_WITH_CLIENT_AUTH potential server files using client-side auth:${NC}"
  grep -r "from '@/app/lib/auth'" app --include="*.ts" --exclude="**/page.tsx" --exclude="**/components/**" --exclude="**/hooks/**" | awk -F ":" '{print $1}'
  echo ""
else
  echo "${GREEN}No server files using client-side auth (good)${NC}"
  echo ""
fi

# Check for server-side auth in client components
echo "${YELLOW}Checking for server-side auth in client components...${NC}"
CLIENT_WITH_SERVER_AUTH=$(grep -r "'use client'" app --include="*.tsx" | awk -F ":" '{print $1}' | xargs grep -l "from '@/app/lib/auth-server'" | wc -l)

if [ $CLIENT_WITH_SERVER_AUTH -gt 0 ]; then
  echo "${RED}Found $CLIENT_WITH_SERVER_AUTH client components using server-side auth:${NC}"
  grep -r "'use client'" app --include="*.tsx" | awk -F ":" '{print $1}' | xargs grep -l "from '@/app/lib/auth-server'" | xargs echo
  echo ""
else
  echo "${GREEN}No client components using server-side auth (good)${NC}"
  echo ""
fi

# Check for inconsistent function usage
echo "${YELLOW}Checking for inconsistent function usage...${NC}"

WRONG_GETROLE_COUNT=$(grep -r "getUserRole" app/api --include="*.ts" | wc -l)
if [ $WRONG_GETROLE_COUNT -gt 0 ]; then
  echo "${RED}Found $WRONG_GETROLE_COUNT API files still using getUserRole (should use getServerUserRole):${NC}"
  grep -r "getUserRole" app/api --include="*.ts" | awk -F ":" '{print $1}' | uniq
  echo ""
else
  echo "${GREEN}No API files using getUserRole (good)${NC}"
  echo ""
fi

echo "Auth audit complete!" 