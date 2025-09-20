const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test cases for Package API
const packageTestCases = [
    {
        name: 'Test: Get all packages (protected endpoint)',
        method: 'GET',
        url: '/packages',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should return list of all packages with ID, PackageName, and room limits'
    },
    {
        name: 'Test: Get packages without authentication',
        method: 'GET', 
        url: '/packages',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Should return unauthorized error when no token provided'
    }
];

// Login function to get authentication token
async function login() {
    const loginData = new FormData();
    loginData.append('email', 'test@example.com');
    loginData.append('password', 'password123');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.status === 200 && response.data.token) {
            console.log('[SUCCESS] Login successful');
            return response.data.token;
        }
    } catch (error) {
        console.log('[WARNING] Login failed, using mock token for protected endpoint tests');
        return 'mock_token_for_testing';
    }
}

// Main test runner function
async function runPackageAPITests() {
    console.log('='.repeat(60));
    console.log('🧪 PACKAGE API INTEGRATION TESTS');
    console.log('='.repeat(60));
    
    // Get authentication token
    const token = await login();
    
    let passedTests = 0;
    let totalTests = packageTestCases.length;
    
    for (const testCase of packageTestCases) {
        console.log(`\n📋 ${testCase.name}`);
        console.log(`   Description: ${testCase.description}`);
        
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
                console.log(`   ✅ Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                
                // Additional checks for successful responses
                if (response.status === 200) {
                    const data = response.data;
                    
                    if (Array.isArray(data)) {
                        console.log(`   ✅ Response: Array with ${data.length} packages`);
                        
                        // Check structure of first package if exists
                        if (data.length > 0) {
                            const firstPackage = data[0];
                            const requiredFields = ['ID', 'PackageName', 'MeetingRoomLimit', 'TrainingRoomLimit', 'MultiFunctionRoomLimit'];
                            const hasAllFields = requiredFields.every(field => firstPackage.hasOwnProperty(field));
                            
                            if (hasAllFields) {
                                console.log(`   ✅ Structure: Contains all required fields`);
                                console.log(`   📄 Sample: ID=${firstPackage.ID}, Name="${firstPackage.PackageName}"`);
                                console.log(`   📄 Limits: Meeting=${firstPackage.MeetingRoomLimit}, Training=${firstPackage.TrainingRoomLimit}, Multi=${firstPackage.MultiFunctionRoomLimit}`);
                                
                                // Validate room limits are non-negative numbers
                                const limits = [firstPackage.MeetingRoomLimit, firstPackage.TrainingRoomLimit, firstPackage.MultiFunctionRoomLimit];
                                const validLimits = limits.every(limit => typeof limit === 'number' && limit >= 0);
                                
                                if (validLimits) {
                                    console.log(`   ✅ Validation: All room limits are valid non-negative numbers`);
                                } else {
                                    console.log(`   ⚠️  Validation: Some room limits are invalid`);
                                }
                            } else {
                                console.log(`   ⚠️  Structure: Missing required fields`);
                                console.log(`   📄 Available fields: ${Object.keys(firstPackage).join(', ')}`);
                            }
                        }
                    } else {
                        console.log(`   ⚠️  Response: Not an array (${typeof data})`);
                    }
                }
                
                passedTests++;
            } else {
                console.log(`   ❌ Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
            }
            
        } catch (error) {
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                if (status === testCase.expectedStatus) {
                    console.log(`   ✅ Status: ${status} (Expected: ${testCase.expectedStatus})`);
                    console.log(`   ✅ Error Response: ${JSON.stringify(error.response.data)}`);
                    passedTests++;
                } else {
                    console.log(`   ❌ Status: ${status} (Expected: ${testCase.expectedStatus})`);
                    console.log(`   📄 Error Response: ${JSON.stringify(error.response.data)}`);
                }
            } else if (error.request) {
                console.log(`   ❌ Network Error: No response received`);
                console.log(`   📄 Details: ${error.message}`);
            } else {
                console.log(`   ❌ Request Error: ${error.message}`);
            }
        }
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(60));
    console.log(`📊 PACKAGE API TEST SUMMARY`);
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log(`🎉 All Package API tests passed!`);
    } else {
        console.log(`⚠️  Some Package API tests failed. Check the logs above.`);
    }
    
    return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runPackageAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('[ERROR] Package API tests crashed:', error.message);
            process.exit(1);
        });
}

module.exports = { runPackageAPITests };
