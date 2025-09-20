@echo off
REM Sci-Park API Testing Automation Script (Windows)
REM This script will run Unit Tests first, then API Integration Tests

setlocal enabledelayedexpansion

echo ==================================================
echo Sci-Park Automated Testing Suite
echo ==================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the API_Test directory
    exit /b 1
)

REM Step 1: Install Node.js dependencies
echo [INFO] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully
echo.

REM Step 2: Stop any existing Go server
echo [INFO] Checking for existing Go server...
curl -s http://localhost:8000/ >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Go server is running. Stopping it automatically...
    taskkill /F /IM go.exe >nul 2>&1
    taskkill /F /IM main.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo [SUCCESS] Existing Go server stopped
) else (
    echo [SUCCESS] Port 8000 is available
)

REM Step 3: Run Go Unit Tests first
echo ==================================================
echo Running Go Unit Tests
echo ==================================================
echo [INFO] Switching to test directory...

cd ..\test

echo [INFO] Running Go unit tests with validation...
go test -v
if errorlevel 1 (
    echo [ERROR] Some Go unit tests failed
    echo [WARNING] Continuing with API tests anyway...
) else (
    echo [SUCCESS] All Go unit tests passed!
)
echo.

REM Step 4: Return to API_Test directory
echo [INFO] Returning to API_Test directory...
cd ..\API_Test

REM Step 5: Cleanup old test database and backup original database
echo ==================================================
echo Setting up Test Environment
echo ==================================================
echo [INFO] Cleaning up old test database...
if exist "..\sci-park_test.db" (
    del "..\sci-park_test.db"
    echo [SUCCESS] Old test database removed
) else (
    echo [INFO] No old test database found
)

echo [INFO] Creating database backup...

if exist "..\sci-park_web-application.db" (
    copy "..\sci-park_web-application.db" "..\sci-park_web-application.db.backup" >nul
    echo [SUCCESS] Database backed up
) else (
    echo [WARNING] Original database not found, continuing anyway...
)

REM Step 6: Create test database and start Go server with test DB
echo [INFO] Creating test database...
if exist "..\sci-park_web-application.db" (
    copy "..\sci-park_web-application.db" "..\sci-park_test.db" >nul
    echo [SUCCESS] Test database created
) else (
    echo [WARNING] No database to copy, tests will use existing database
)

echo [INFO] Starting Go server with test database...
cd ..
start /B powershell -Command "& {$env:DB_NAME='sci-park_test.db'; go run main.go}" >nul 2>&1
cd API_Test

REM Wait for server to start
echo [INFO] Waiting for Go server to start...
timeout /t 5 /nobreak >nul

REM Check if server is running
:check_server
curl -s http://localhost:8000/ >nul 2>&1
if errorlevel 1 (
    echo [INFO] Server still starting...
    timeout /t 2 /nobreak >nul
    goto check_server
)
echo [SUCCESS] Go server started with test database
echo.

REM Step 7: Run API Integration Tests
echo ==================================================
echo Running API Integration Tests
echo ==================================================

echo [INFO] Running Mock Test Strategy (Safe Testing)...
echo.
call node mock_test_strategy.js
if errorlevel 1 (
    echo [ERROR] Mock tests failed
) else (
    echo [SUCCESS] Mock tests completed successfully!
)
echo.

echo [INFO] Running Complete User API Tests...
echo.
call node complete_user_api_test.js
if errorlevel 1 (
    echo [WARNING] Complete API tests had some issues
) else (
    echo [SUCCESS] Complete API tests finished!
)
echo.

echo [INFO] Running Transaction Tests with Cleanup...
echo.
call node transaction_test.js
if errorlevel 1 (
    echo [WARNING] Transaction tests had some issues
) else (
    echo [SUCCESS] Transaction tests completed!
)
echo.

REM Step 8: Stop Go server and Cleanup
echo ==================================================
echo Cleanup and Rollback
echo ==================================================

echo [INFO] Stopping Go server...
taskkill /F /IM go.exe >nul 2>&1
taskkill /F /IM main.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [SUCCESS] Go server stopped

echo [INFO] Keeping test database for inspection...
if exist "..\sci-park_test.db" (
    echo [SUCCESS] Test database preserved at: ..\sci-park_test.db
    echo [INFO] You can inspect the test data and delete it manually when done
) else (
    echo [WARNING] Test database not found
)

echo [INFO] Restoring original database...
if exist "..\sci-park_web-application.db.backup" (
    move "..\sci-park_web-application.db.backup" "..\sci-park_web-application.db" >nul
    echo [SUCCESS] Original database restored
) else (
    echo [WARNING] No backup to restore
)
echo.

REM Step 9: Final Summary
echo ==================================================
echo Testing Summary
echo ==================================================
echo [SUCCESS] All tests completed!
echo.
echo What was tested:
echo   - Go Unit Tests (Validation Logic)
echo   - API Integration Tests (Mock Strategy)  
echo   - Complete User API Flow
echo   - Transaction-based Tests
echo.
echo Database Status:
echo   - Original database restored
echo   - Test database preserved for inspection
echo.
echo Next Steps:
echo   - Review test outputs above for any failures
echo   - Check Go server logs for any issues
echo   - Run individual tests if needed:
echo     * node mock_test_strategy.js
echo     * node complete_user_api_test.js
echo     * node transaction_test.js
echo.
echo [SUCCESS] Testing automation completed!
echo.