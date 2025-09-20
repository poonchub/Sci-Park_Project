// Setup Test Environment
const fs = require('fs');
const path = require('path');

const TEST_ENV_CONFIG = `
# Test Environment Configuration
DB_NAME=sci-park_test.db
DB_PATH=./sci-park_test.db

# API Configuration
API_PORT=8001
API_HOST=localhost

# Test Mode
NODE_ENV=test
TEST_MODE=true

# JWT Secret (for testing)
JWT_SECRET=test-jwt-secret-key

# Other test configurations
BCRYPT_ROUNDS=1
`;

function setupTestEnvironment() {
    console.log('🔧 Setting up Test Environment...');
    
    // 1. สร้าง .env.test
    const testEnvPath = path.join(__dirname, '..', '.env.test');
    fs.writeFileSync(testEnvPath, TEST_ENV_CONFIG.trim());
    console.log('✅ Created .env.test');
    
    // 2. สร้าง test database script
    const setupDbScript = `
package main

import (
    "log"
    "sci-park_web-application/config"
)

func main() {
    // Load test environment
    config.LoadEnv()
    
    // Connect to test database
    config.ConnectDB()
    
    // Setup test database
    config.SetupDatabase()
    
    log.Println("✅ Test database setup completed")
}
`;
    
    const setupDbPath = path.join(__dirname, '..', 'setup_test_db.go');
    fs.writeFileSync(setupDbPath, setupDbScript.trim());
    console.log('✅ Created setup_test_db.go');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Run: go run setup_test_db.go');
    console.log('2. Start test server: go run main.go');
    console.log('3. Run API tests: node complete_user_api_test.js');
}

function cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    const cleanupScript = `
const axios = require('axios');

async function cleanup() {
    try {
        // Delete test users (if API supports it)
        const testEmails = [
            'john.doe.test@example.com',
            'jane.smith.test@example.com',
            'external.user.test@example.com'
        ];
        
        console.log('🗑️  Deleting test users...');
        // Implementation depends on your API
        
    } catch (error) {
        console.log('⚠️  Cleanup error:', error.message);
    }
}

cleanup();
`;
    
    const cleanupPath = path.join(__dirname, 'cleanup_test_data.js');
    fs.writeFileSync(cleanupPath, cleanupScript.trim());
    console.log('✅ Created cleanup_test_data.js');
}

if (require.main === module) {
    setupTestEnvironment();
    cleanupTestData();
}

module.exports = { setupTestEnvironment, cleanupTestData };
