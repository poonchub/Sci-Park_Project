const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test cases for Gender API
const genderTestCases = [
    {
        name: 'Test: Get all genders (public endpoint)',
        method: 'GET',
        url: '/genders',
        requiresAuth: false,
        expectedStatus: 200,
        description: 'Should return list of all genders without authentication (public endpoint)'
    },
    {
        name: 'Test: Get genders with authentication token',
        method: 'GET', 
        url: '/genders',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should also work with authentication token'
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
async function runGenderAPITests() {
    console.log('='.repeat(60));
    console.log('GENDER API INTEGRATION TESTS');
    console.log('='.repeat(60));
    
    // Get authentication token (for authenticated test case)
    let token;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Failed to get authentication token for authenticated tests');
        console.log('[INFO] Will skip authenticated test cases');
        token = null;
    }
    
    let passedTests = 0;
    let totalTests = genderTestCases.length;
    
    for (const testCase of genderTestCases) {
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
            if (testCase.requiresAuth) {
                if (token) {
                    config.headers = {
                        'Authorization': `Bearer ${token}`
                    };
                } else {
                    console.log(`[INFO] Skipping authenticated test (no token available)`);
                    continue;
                }
            }
            
            const response = await axios(config);
            
            // Check response status
            if (response.status === testCase.expectedStatus) {
                console.log(`[SUCCESS] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                
                // Additional checks for successful responses
                if (response.status === 200) {
                    const data = response.data;
                    
                    if (Array.isArray(data)) {
                        console.log(`[SUCCESS] Response: Array with ${data.length} genders`);
                        
                        // Check structure of first gender if exists
                        if (data.length > 0) {
                            const firstGender = data[0];
                            if (firstGender.ID && firstGender.Name) {
                                console.log(`[SUCCESS] Structure: Contains ID and Name fields`);
                                console.log(`[INFO] Sample: ID=${firstGender.ID}, Name="${firstGender.Name}"`);
                                
                                // Check for common gender values
                                const genderNames = data.map(gender => gender.Name.toLowerCase());
                                const commonGenders = ['male', 'female', 'other', 'ชาย', 'หญิง'];
                                const foundCommonGenders = commonGenders.filter(common => 
                                    genderNames.some(name => name.includes(common))
                                );
                                
                                if (foundCommonGenders.length > 0) {
                                    console.log(`[SUCCESS] Content: Found common gender types: ${foundCommonGenders.join(', ')}`);
                                } else {
                                    console.log(`[INFO] Content: Available genders: ${genderNames.join(', ')}`);
                                }
                            } else {
                                console.log(`[WARNING] Structure: Missing expected fields (ID, Name)`);
                                console.log(`[INFO] Available fields: ${Object.keys(firstGender).join(', ')}`);
                            }
                        } else {
                            console.log(`[WARNING] Response: Empty gender list`);
                        }
                    } else {
                        console.log(`[WARNING] Response: Not an array (${typeof data})`);
                        console.log(`[INFO] Response type: ${JSON.stringify(data)}`);
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
    console.log(`GENDER API TEST SUMMARY`);
    console.log('='.repeat(60));
    console.log(`[SUCCESS] Passed: ${passedTests}/${totalTests}`);
    console.log(`[ERROR] Failed: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log(`[SUCCESS] All Gender API tests passed!`);
    } else {
        console.log(`[WARNING] Some Gender API tests failed. Check the logs above.`);
    }
    
    return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runGenderAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('[ERROR] Gender API tests crashed:', error.message);
            process.exit(1);
        });
}

module.exports = { runGenderAPITests };
