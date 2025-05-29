#!/bin/bash

# Test Organization Scripts
# Scripts pour organiser et exécuter les tests du projet PandeGooseium

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Test Organization for PandeGooseium${NC}"
echo "======================================"

# Fonction pour exécuter les tests par catégorie
run_test_category() {
    local category=$1
    local description=$2
    
    echo -e "\n${YELLOW}📁 Running ${description}...${NC}"
    echo "----------------------------------------"
    
    if npm test -- "tests/${category}" --verbose; then
        echo -e "${GREEN}✅ ${description} passed!${NC}"
    else
        echo -e "${RED}❌ ${description} failed!${NC}"
        return 1
    fi
}

# Test des différentes catégories
echo -e "\n${BLUE}Running tests by category:${NC}"

run_test_category "api" "API Tests"
run_test_category "utils" "Utility Tests" 
run_test_category "hooks" "Hook Tests"
run_test_category "components" "Component Tests"

echo -e "\n${YELLOW}🔗 Running Integration Tests...${NC}"
echo "----------------------------------------"
if npm test -- "tests/integration" --verbose; then
    echo -e "${GREEN}✅ Integration Tests passed!${NC}"
else
    echo -e "${RED}❌ Integration Tests failed!${NC}"
fi

echo -e "\n${BLUE}📊 Running full test suite with coverage...${NC}"
echo "----------------------------------------"
npm run test:coverage

echo -e "\n${GREEN}🎉 Test organization verification complete!${NC}"
echo -e "${BLUE}You can now use the following commands:${NC}"
echo "  npm run test:api        - Run API tests only"
echo "  npm run test:utils      - Run utility tests only"
echo "  npm run test:hooks      - Run hook tests only"
echo "  npm run test:components - Run component tests only"
echo "  npm run test:integration - Run integration tests only"
echo "  npm run test:coverage   - Run all tests with coverage"
echo "  npm run test:watch      - Run tests in watch mode"
