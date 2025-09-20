const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Generate unique test data to avoid conflicts
const generateUniqueJobPosition = () => {
    const timestamp = Date.now();
    return {
        Name: `Test Job Position ${timestamp}`
    };
};

// Test cases for JobPosition API
const jobPositionTestCases = [
    {
        name: 'Test: Get all job positions',
        method: 'GET',
        url: '/job-positions',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should return list of all job positions with success status'
    },
    {
        name: 'Test: Get job positions without authentication',
        method: 'GET', 
        url: '/job-positions',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Should return unauthorized error when no token provided'
    },
    {
        name: 'Test: Create new job position',
        method: 'POST',
        url: '/create-job-position',
        requiresAuth: true,
        expectedStatus: 201,
        data: generateUniqueJobPosition(),
        description: 'Should create a new job position with valid data'
    },
    {
        name: 'Test: Create job position with empty name',
        method: 'POST',
        url: '/create-job-position',
        requiresAuth: true,
        expectedStatus: 400,
        data: { Name: '' },
        description: 'Should return validation error for empty name'
    },
    {
        name: 'Test: Create job position without name field',
        method: 'POST',
        url: '/create-job-position',
        requiresAuth: true,
        expectedStatus: 400,
        data: {},
        description: 'Should return validation error when name field is missing'
    }
];

// Dynamic test cases that will be added after creating a job position
let dynamicTestCases = [];

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
        console.log('[ERROR] Login failed:');
        console.log('  - Status:', error.response?.status);
        console.log('  - Data:', error.response?.data);
        console.log('  - Message:', error.message);
        console.log('  - URL:', `${BASE_URL}/auth/login`);
        throw new Error('Cannot proceed without valid authentication token');
    }
}

// Main test runner function
async function runJobPositionAPITests() {
    console.log('='.repeat(60));
    console.log('JOB POSITION API INTEGRATION TESTS');
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
    let totalTests = jobPositionTestCases.length;
    let createdJobPositionId = null;
    
    // Run initial test cases
    for (const testCase of jobPositionTestCases) {
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
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            }
            
            // Add data for POST requests
            if (testCase.data) {
                config.data = testCase.data;
            }
            
            const response = await axios(config);
            
            // Check response status
            if (response.status === testCase.expectedStatus) {
                console.log(`[SUCCESS] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                
                // Additional checks based on response type
                if (response.status === 200 && testCase.method === 'GET') {
                    const data = response.data;
                    
                    if (data.status === 'success' && Array.isArray(data.data)) {
                        console.log(`[SUCCESS] Response: Success with ${data.data.length} job positions`);
                        
                        // Check structure of first job position if exists
                        if (data.data.length > 0) {
                            const firstJobPosition = data.data[0];
                            if (firstJobPosition.ID && firstJobPosition.Name) {
                                console.log(`[SUCCESS] Structure: Contains ID and Name fields`);
                                console.log(`[INFO] Sample: ID=${firstJobPosition.ID}, Name="${firstJobPosition.Name}"`);
                            } else {
                                console.log(`[WARNING] Structure: Missing expected fields (ID, Name)`);
                            }
                        }
                    } else {
                        console.log(`[WARNING] Response: Unexpected structure`);
                    }
                } else if (response.status === 201 && testCase.method === 'POST') {
                    const data = response.data;
                    
                    if (data.status === 'success' && data.data && data.data.ID) {
                        createdJobPositionId = data.data.ID;
                        console.log(`[SUCCESS] Created: Job position with ID ${createdJobPositionId}`);
                        console.log(`[INFO] Data: ${JSON.stringify(data.data)}`);
                        
                        // Add dynamic test cases for the created job position
                        dynamicTestCases = [
                            {
                                name: `Test: Get job position by ID (${createdJobPositionId})`,
                                method: 'GET',
                                url: `/job-position/${createdJobPositionId}`,
                                requiresAuth: true,
                                expectedStatus: 200,
                                description: 'Should return specific job position by ID'
                            },
                            {
                                name: `Test: Update job position (${createdJobPositionId})`,
                                method: 'PATCH',
                                url: `/update-job-position/${createdJobPositionId}`,
                                requiresAuth: true,
                                expectedStatus: 200,
                                data: { Name: `Updated Job Position ${Date.now()}` },
                                description: 'Should update job position with new data'
                            },
                            {
                                name: `Test: Delete job position (${createdJobPositionId})`,
                                method: 'DELETE',
                                url: `/job-position/${createdJobPositionId}`,
                                requiresAuth: true,
                                expectedStatus: 200,
                                description: 'Should delete the created job position'
                            }
                        ];
                        
                        totalTests += dynamicTestCases.length;
                    } else {
                        console.log(`[WARNING] Response: Missing ID in created job position`);
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
    
    // Run dynamic test cases (GET by ID, UPDATE, DELETE)
    for (const testCase of dynamicTestCases) {
        console.log(`\n[TEST] ${testCase.name}`);
        console.log(`[INFO] Description: ${testCase.description}`);
        
        try {
            const config = {
                method: testCase.method,
                url: `${BASE_URL}${testCase.url}`,
                timeout: 10000
            };
            
            if (testCase.requiresAuth && token) {
                config.headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            }
            
            if (testCase.data) {
                config.data = testCase.data;
            }
            
            const response = await axios(config);
            
            if (response.status === testCase.expectedStatus) {
                console.log(`[SUCCESS] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                
                const data = response.data;
                if (data.status === 'success') {
                    console.log(`[SUCCESS] Response: ${data.message || 'Success'}`);
                    if (data.data) {
                        console.log(`[INFO] Data: ${JSON.stringify(data.data)}`);
                    }
                }
                
                passedTests++;
            } else {
                console.log(`[ERROR] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
            }
            
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === testCase.expectedStatus) {
                    console.log(`[SUCCESS] Status: ${status} (Expected: ${testCase.expectedStatus})`);
                    console.log(`[SUCCESS] Error Response: ${JSON.stringify(error.response.data)}`);
                    passedTests++;
                } else {
                    console.log(`[ERROR] Status: ${status} (Expected: ${testCase.expectedStatus})`);
                    console.log(`[INFO] Error Response: ${JSON.stringify(error.response.data)}`);
                }
            } else {
                console.log(`[ERROR] Network Error: ${error.message}`);
            }
        }
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(60));
    console.log(`JOB POSITION API TEST SUMMARY`);
    console.log('='.repeat(60));
    console.log(`[SUCCESS] Passed: ${passedTests}/${totalTests}`);
    console.log(`[ERROR] Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log(`[SUCCESS] All Job Position API tests passed!`);
    } else {
        console.log(`[WARNING] Some Job Position API tests failed. Check the logs above.`);
    }
    
    return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runJobPositionAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('[ERROR] Job Position API tests crashed:', error.message);
            process.exit(1);
        });
}

module.exports = { runJobPositionAPITests };
