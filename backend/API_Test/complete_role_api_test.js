const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test cases for Role API
const roleTestCases = [
    {
        name: 'Test: Get all roles (protected endpoint)',
        method: 'GET',
        url: '/roles',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should return list of all roles with ID and Name fields'
    },
    {
        name: 'Test: Get roles without authentication',
        method: 'GET', 
        url: '/roles',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Should return unauthorized error when no token provided'
    }
];

// Login function to get authentication token
async function login() {
    const loginData = {
        email: 'admin@gmail.com',
        password: '123456'
    };
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && response.data.Token) {
            console.log('[SUCCESS] Login successful, got real token');
            return response.data.Token;
        } else {
            console.log('[ERROR] Login response missing token:', response.data);
            throw new Error('Login successful but no token received');
        }
    } catch (error) {
        console.log('[ERROR] Login failed:', error.response?.data || error.message);
        throw new Error('Cannot proceed without valid authentication token');
    }
}

// Main test runner function
async function runRoleAPITests() {
    console.log('='.repeat(60));
    console.log('ROLE API INTEGRATION TESTS');
    console.log('='.repeat(60));
    
    // Get authentication token
    let token;
    try {
        token = await login();
    } catch (error) {
        console.log('[ERROR] Failed to get authentication token:', error.message);
        console.log('[ERROR] Cannot run protected endpoint tests');
        return false;
    }
    
    let passedTests = 0;
    let totalTests = roleTestCases.length;
    
    for (const testCase of roleTestCases) {
        console.log(`\n[TEST] ${testCase.name}`);
        console.log(`[INFO] Description: ${testCase.description}`);
        
        try {
            // Prepare request config
            const config = {
                method: testCase.method,
                url: `${BASE_URL}${testCase.url}`,
                timeout: 10000
            };
            
            // Add authorization header if required
            if (testCase.requiresAuth && token) {
                config.headers = {
                    'Authorization': `Bearer ${token}`
                };
            }
            
            const response = await axios(config);
            
            // Check response status
            if (response.status === testCase.expectedStatus) {
                console.log(`[SUCCESS] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                
                // Additional checks for successful responses
                if (response.status === 200) {
                    const data = response.data;
                    
                    if (Array.isArray(data)) {
                        console.log(`[SUCCESS] Response: Array with ${data.length} roles`);
                        
                        // Check structure of first role if exists
                        if (data.length > 0) {
                            const firstRole = data[0];
                            if (firstRole.ID && firstRole.Name) {
                                console.log(`[SUCCESS] Structure: Contains ID and Name fields`);
                                console.log(`[INFO] Sample: ID=${firstRole.ID}, Name="${firstRole.Name}"`);
                            } else {
                                console.log(`[WARNING] Structure: Missing expected fields (ID, Name)`);
                            }
                        }
                    } else {
                        console.log(`[WARNING] Response: Not an array (${typeof data})`);
                    }
                }
                
                passedTests++;
            } else {
                console.log(`[ERROR] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
            }
            
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                if (status === testCase.expectedStatus) {
                    console.log(`[SUCCESS] Status: ${status} (Expected: ${testCase.expectedStatus})`);
                    console.log(`[SUCCESS] Error Response: ${JSON.stringify(error.response.data)}`);
                    passedTests++;
                } else {
                    console.log(`[ERROR] Status: ${status} (Expected: ${testCase.expectedStatus})`);
                    console.log(`[INFO] Error Response: ${JSON.stringify(error.response.data)}`);
                }
            } else if (error.request) {
                console.log(`[ERROR] Network Error: No response received`);
                console.log(`[INFO] Details: ${error.message}`);
            } else {
                console.log(`[ERROR] Request Error: ${error.message}`);
            }
        }
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(60));
    console.log(`ROLE API TEST SUMMARY`);
    console.log('='.repeat(60));
    console.log(`[SUCCESS] Passed: ${passedTests}/${totalTests}`);
    console.log(`[ERROR] Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log(`[SUCCESS] All Role API tests passed!`);
    } else {
        console.log(`[WARNING] Some Role API tests failed. Check the logs above.`);
    }
    
    return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runRoleAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('[ERROR] Role API tests crashed:', error.message);
            process.exit(1);
        });
}

module.exports = { runRoleAPITests };
