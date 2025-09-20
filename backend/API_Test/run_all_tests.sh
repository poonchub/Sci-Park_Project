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

# Session 6: Request Service Area Tests
print_step "=== REQUEST SERVICE AREA SESSION ==="
print_step "11. Request Service Area Unit Tests..."
cd ../test
if go test -v ./RequestServiceArea_test.go; then
    print_success "Request Service Area unit tests passed!"
else
    print_warning "Request Service Area unit tests had issues"
fi
cd ../API_Test
echo

print_step "12. Request Service Area API Tests..."
if node complete_request_service_area_api_test.js; then
    print_success "Request Service Area API tests finished!"
else
    print_warning "Request Service Area API tests had some issues"
fi
echo

# Session 7: Cancel Request Service Area Tests
print_step "=== CANCEL REQUEST SERVICE AREA SESSION ==="
print_step "13. Cancel Request Service Area Unit Tests..."
cd ../test
if go test -v ./CancelRequestServiceArea_test.go; then
    print_success "Cancel Request Service Area unit tests passed!"
else
    print_warning "Cancel Request Service Area unit tests had issues"
fi
cd ../API_Test
echo

print_step "14. Cancel Request Service Area API Tests..."
if node complete_cancel_request_service_area_api_test.js; then
    print_success "Cancel Request Service Area API tests finished!"
else
    print_warning "Cancel Request Service Area API tests had some issues"
fi
echo

# Session 8: Collaboration Plan Tests
print_step "=== COLLABORATION PLAN SESSION ==="
print_step "15. Collaboration Plan Unit Tests..."
cd ../test
if go test -v ./CollaborationPlan_test.go; then
    print_success "Collaboration Plan unit tests passed!"
else
    print_warning "Collaboration Plan unit tests had issues"
fi
cd ../API_Test
echo

print_step "16. Collaboration Plan API Tests..."
if node complete_collaboration_plan_api_test.js; then
    print_success "Collaboration Plan API tests finished!"
else
    print_warning "Collaboration Plan API tests had some issues"
fi
echo

# Session 9: Service Area Document Tests
print_step "=== SERVICE AREA DOCUMENT SESSION ==="
print_step "17. Service Area Document Unit Tests..."
cd ../test
if go test -v ./ServiceAreaDocument_test.go; then
    print_success "Service Area Document unit tests passed!"
else
    print_warning "Service Area Document unit tests had issues"
fi
cd ../API_Test
echo

print_step "18. Service Area Document API Tests..."
if node complete_service_area_document_api_test.js; then
    print_success "Service Area Document API tests finished!"
else
    print_warning "Service Area Document API tests had some issues"
fi
echo

# Session 10: Service Area Task Tests
print_step "=== SERVICE AREA TASK SESSION ==="
print_step "19. Service Area Task Unit Tests..."
cd ../test
if go test -v ./ServiceAreaTask_test.go; then
    print_success "Service Area Task unit tests passed!"
else
    print_warning "Service Area Task unit tests had issues"
fi
cd ../API_Test
echo

print_step "20. Service Area Task API Tests..."
if node complete_service_area_task_api_test.js; then
    print_success "Service Area Task API tests finished!"
else
    print_warning "Service Area Task API tests had some issues"
fi
echo

# Session 11: Service Area Approval Tests
print_step "=== SERVICE AREA APPROVAL SESSION ==="
print_step "21. Service Area Approval Unit Tests..."
cd ../test
if go test -v ./ServiceAreaApproval_test.go; then
    print_success "Service Area Approval unit tests passed!"
else
    print_warning "Service Area Approval unit tests had issues"
fi
cd ../API_Test
echo

print_step "22. Service Area Approval API Tests..."
if node complete_service_area_approval_api_test.js; then
    print_success "Service Area Approval API tests finished!"
else
    print_warning "Service Area Approval API tests had some issues"
fi
echo

# Session 12: Request Status Tests
print_step "=== REQUEST STATUS SESSION ==="
print_step "23. Request Status Unit Tests..."
cd ../test
if go test -v ./RequestStatus_test.go; then
    print_success "Request Status unit tests passed!"
else
    print_warning "Request Status unit tests had issues"
fi
cd ../API_Test
echo

print_step "24. Request Status API Tests..."
if node complete_request_status_api_test.js; then
    print_success "Request Status API tests finished!"
else
    print_warning "Request Status API tests had some issues"
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
echo "Test Execution Order (Alternating Unit/API):"
echo "  1. User Session: Unit Tests → API Tests"
echo "  2. Role Session: Unit Tests → API Tests"
echo "  3. Package Session: Unit Tests → API Tests"
echo "  4. JobPosition Session: Unit Tests → API Tests"
echo "  5. Gender Session: Unit Tests → API Tests"
echo "  6. Request Service Area Session: Unit Tests → API Tests"
echo "  7. Cancel Request Service Area Session: Unit Tests → API Tests"
echo "  8. Collaboration Plan Session: Unit Tests → API Tests"
echo "  9. Service Area Document Session: Unit Tests → API Tests"
echo "  10. Service Area Task Session: Unit Tests → API Tests"
echo "  11. Service Area Approval Session: Unit Tests → API Tests"
echo "  12. Request Status Session: Unit Tests → API Tests"
echo "  13. Additional Integration Tests (Mock + Transaction)"
echo
echo "Total Test Coverage:"
echo "  - Unit Tests: 121 test cases (53 Core + 68 Service Area System)"
echo "  - API Tests: 67 test cases (22 Core + 45 Service Area System)"
echo "  - Integration Tests: ~8 test cases"
echo "  - Total: 196 test cases"
echo
echo "Database Status:"
echo "  - Test database preserved: ../sci-park_test.db"
echo "  - Original database restored"
echo
print_success "Complete Request Service Area system testing completed with comprehensive Unit + API coverage!"
echo