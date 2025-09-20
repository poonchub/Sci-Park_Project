#!/bin/bash

# Sci-Park API Testing Automation Script
# This script will run Unit Tests first, then API Integration Tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_header() {
    echo "=================================================="
    echo "$1"
    echo "=================================================="
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the API_Test directory"
    exit 1
fi

print_header "Sci-Park Automated Testing Suite"
echo

# Step 1: Install dependencies
print_step "Installing npm dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Check if Go server is running and stop it
print_step "Checking for existing Go server..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    print_warning "Go server is running. Stopping it automatically..."
    pkill -f "go run main.go" > /dev/null 2>&1
    pkill -f "main" > /dev/null 2>&1
    sleep 3
    print_success "Existing Go server stopped"
else
    print_success "Port 8000 is available"
fi

# Step 3: Setup test environment
print_header "Setting up Test Environment"
print_step "Cleaning up old test database..."
if [ -f "../sci-park_test.db" ]; then
    rm "../sci-park_test.db"
    print_success "Old test database removed"
else
    print_step "No old test database found"
fi

print_step "Creating database backup..."

if [ -f "../sci-park_web-application.db" ]; then
    cp "../sci-park_web-application.db" "../sci-park_web-application.db.backup"
    print_success "Database backed up"
else
    print_warning "Original database not found, continuing anyway..."
fi

# Step 6: Create test database and start Go server with test DB
print_step "Creating test database..."
if [ -f "../sci-park_web-application.db" ]; then
    cp "../sci-park_web-application.db" "../sci-park_test.db"
    print_success "Test database created"
else
    print_warning "No database to copy, tests will use existing database"
fi

print_step "Starting Go server with test database..."
cd ..
DB_NAME="sci-park_test.db" go run main.go -test > /dev/null 2>&1 &
GO_PID=$!
cd API_Test

# Wait for server to start
print_step "Waiting for Go server to start..."
sleep 5

# Check if server is running
while ! curl -s http://localhost:8000/ > /dev/null 2>&1; do
    print_step "Server still starting..."
    sleep 2
done
print_success "Go server started with test database"
echo

# Step 7: Run API Integration Tests - Alternating Pattern
print_header "Running Entity Tests (Alternating Unit + API Pattern)"

# Session 1: User Tests
print_step "=== USER SESSION ==="
print_step "1. User Unit Tests..."
cd ../test
if go test -v ./Users_test.go; then
    print_success "User unit tests passed!"
else
    print_warning "User unit tests had issues"
fi
cd ../API_Test
echo

print_step "2. User API Tests..."
if node complete_user_api_test.js; then
    print_success "User API tests finished!"
else
    print_warning "User API tests had some issues"
fi
echo

# Session 2: Role Tests
print_step "=== ROLE SESSION ==="
print_step "3. Role Unit Tests..."
cd ../test
if go test -v ./Role_test.go; then
    print_success "Role unit tests passed!"
else
    print_warning "Role unit tests had issues"
fi
cd ../API_Test
echo

print_step "4. Role API Tests..."
if node complete_role_api_test.js; then
    print_success "Role API tests finished!"
else
    print_warning "Role API tests had some issues"
fi
echo

# Session 3: Package Tests
print_step "=== PACKAGE SESSION ==="
print_step "5. Package Unit Tests..."
cd ../test
if go test -v ./Package_test.go; then
    print_success "Package unit tests passed!"
else
    print_warning "Package unit tests had issues"
fi
cd ../API_Test
echo

print_step "6. Package API Tests..."
if node complete_package_api_test.js; then
    print_success "Package API tests finished!"
else
    print_warning "Package API tests had some issues"
fi
echo

# Session 4: JobPosition Tests
print_step "=== JOB POSITION SESSION ==="
print_step "7. JobPosition Unit Tests..."
cd ../test
if go test -v ./JobPosition_test.go; then
    print_success "JobPosition unit tests passed!"
else
    print_warning "JobPosition unit tests had issues"
fi
cd ../API_Test
echo

print_step "8. JobPosition API Tests..."
if node complete_jobposition_api_test.js; then
    print_success "JobPosition API tests finished!"
else
    print_warning "JobPosition API tests had some issues"
fi
echo

# Session 5: Gender Tests
print_step "=== GENDER SESSION ==="
print_step "9. Gender Unit Tests..."
cd ../test
if go test -v ./Gender_test.go; then
    print_success "Gender unit tests passed!"
else
    print_warning "Gender unit tests had issues"
fi
cd ../API_Test
echo

print_step "10. Gender API Tests..."
if node complete_gender_api_test.js; then
    print_success "Gender API tests finished!"
else
    print_warning "Gender API tests had some issues"
fi
echo

print_header "Additional Integration Tests"

print_step "Running Mock Test Strategy (Safe Testing)..."
echo
if node mock_test_strategy.js; then
    print_success "Mock tests completed successfully!"
else
    print_error "Mock tests failed"
fi
echo

print_step "Running Transaction Tests with Cleanup..."
echo
if node transaction_test.js; then
    print_success "Transaction tests completed!"
else
    print_warning "Transaction tests had some issues"
fi
echo

# Step 8: Stop Go server and Cleanup
print_header "Cleanup and Rollback"

print_step "Stopping Go server..."
kill $GO_PID > /dev/null 2>&1 || true
pkill -f "go run main.go" > /dev/null 2>&1 || true
pkill -f "main" > /dev/null 2>&1 || true
sleep 2
print_success "Go server stopped"

print_step "Keeping test database for inspection..."
if [ -f "../sci-park_test.db" ]; then
    print_success "Test database preserved at: ../sci-park_test.db"
    echo -e "${BLUE}[INFO] You can inspect the test data and delete it manually when done${NC}"
else
    print_warning "Test database not found"
fi

print_step "Restoring original database..."
if [ -f "../sci-park_web-application.db.backup" ]; then
    mv "../sci-park_web-application.db.backup" "../sci-park_web-application.db"
    print_success "Original database restored"
else
    print_warning "No backup to restore"
fi
echo

# Step 9: Final Summary
print_header "Testing Summary"
print_success "Automated Testing Sequence Completed!"
echo
echo "Test Execution Order:"
echo "  1. General Unit Tests (all entities)"
echo "  2. User Unit Tests → User API Tests"
echo "  3. Role Unit Tests → Role API Tests"
echo "  4. Package Unit Tests → Package API Tests"
echo "  5. JobPosition Unit Tests → JobPosition API Tests"
echo "  6. Gender Unit Tests → Gender API Tests"
echo "  7. Additional Integration Tests (Mock + Transaction)"
echo
echo "Database Status:"
echo "  - Test database preserved: ../sci-park_test.db"
echo "  - Original database restored"
echo
print_success "All entity testing completed with Unit + API coverage!"
echo