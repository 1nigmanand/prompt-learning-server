#!/bin/bash

# Deployment Checklist for Image Comparison Feature
# Run this to verify everything is set up correctly

echo "═══════════════════════════════════════════════════════════"
echo "  IMAGE COMPARISON - DEPLOYMENT CHECKLIST"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Files exist
echo "📁 Checking files..."
FILES=(
  "imageComparison.js"
  "setup-comparison-secrets.sh"
  "test-comparison.js"
  "COMPARISON_SETUP.md"
  "COMPARISON_QUICKSTART.md"
  "COMPARISON_SUMMARY.md"
)

all_files_exist=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file - MISSING"
    all_files_exist=false
  fi
done
echo ""

# Check 2: Modified files
echo "📝 Checking modified files..."
MODIFIED_FILES=(
  "worker.js"
  "loadbalancer.js"
  "server.js"
)

for file in "${MODIFIED_FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "compare-images" "$file"; then
      echo -e "${GREEN}✅${NC} $file - Updated with comparison logic"
    else
      echo -e "${YELLOW}⚠️${NC}  $file - May need updates"
    fi
  else
    echo -e "${RED}❌${NC} $file - MISSING"
  fi
done
echo ""

# Check 3: Script permissions
echo "🔐 Checking script permissions..."
if [ -x "setup-comparison-secrets.sh" ]; then
  echo -e "${GREEN}✅${NC} setup-comparison-secrets.sh is executable"
else
  echo -e "${YELLOW}⚠️${NC}  setup-comparison-secrets.sh needs chmod +x"
  echo "   Run: chmod +x setup-comparison-secrets.sh"
fi
echo ""

# Check 4: Node.js and npm
echo "📦 Checking dependencies..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✅${NC} Node.js installed: $NODE_VERSION"
else
  echo -e "${RED}❌${NC} Node.js not found"
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}✅${NC} npm installed: $NPM_VERSION"
else
  echo -e "${RED}❌${NC} npm not found"
fi
echo ""

# Check 5: Wrangler CLI
echo "☁️  Checking Cloudflare Wrangler..."
if command -v npx &> /dev/null; then
  if npx wrangler --version &> /dev/null; then
    WRANGLER_VERSION=$(npx wrangler --version 2>&1 | head -n 1)
    echo -e "${GREEN}✅${NC} Wrangler available: $WRANGLER_VERSION"
  else
    echo -e "${YELLOW}⚠️${NC}  Wrangler not found (needed for deployment)"
  fi
else
  echo -e "${RED}❌${NC} npx not available"
fi
echo ""

# Check 6: API Keys in script
echo "🔑 Checking API keys configuration..."
if grep -q "sk-dufgdzyrgxejceexpkrwfaptkscwtrempqswknucrwzrvlhp" setup-comparison-secrets.sh; then
  echo -e "${GREEN}✅${NC} Comparison API keys configured in script"
  KEY_COUNT=$(grep -c "sk-" setup-comparison-secrets.sh || echo "0")
  echo "   Found $KEY_COUNT API keys in setup script"
else
  echo -e "${RED}❌${NC} API keys not found in setup script"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "  NEXT STEPS"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Add API keys to workers:"
echo "   ${YELLOW}./setup-comparison-secrets.sh${NC}"
echo ""
echo "2️⃣  Deploy workers:"
echo "   ${YELLOW}./deploy-workers.sh${NC}"
echo ""
echo "3️⃣  Start local server:"
echo "   ${YELLOW}npm start${NC}"
echo ""
echo "4️⃣  Run tests:"
echo "   ${YELLOW}node test-comparison.js${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  DOCUMENTATION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📖 Quick Start:     COMPARISON_QUICKSTART.md"
echo "📚 Full Setup:      COMPARISON_SETUP.md"
echo "📊 Summary:         COMPARISON_SUMMARY.md"
echo "🔬 Test File:       test-comparison.js"
echo ""
echo "═══════════════════════════════════════════════════════════"

if [ "$all_files_exist" = true ]; then
  echo -e "${GREEN}✅ All required files present!${NC}"
  echo "You're ready to deploy the image comparison feature! 🚀"
else
  echo -e "${RED}❌ Some files are missing. Please check the output above.${NC}"
fi

echo "═══════════════════════════════════════════════════════════"
