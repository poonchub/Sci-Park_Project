const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

const requestStatusTestCases = [
    {
        name: 'Test: Get all request statuses',
        method: 'GET',
        url: '/request-statuses',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should retrieve list of all request statuses'
    },
    {
        name: 'Test: Get request statuses without authentication',
        method: 'GET',
        url: '/request-statuses',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Should return unauthorized without authentication token'
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

// Function to run Request Status API tests
async function runRequestStatusAPITests() {
    console.log('\n=== REQUEST STATUS API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Some tests may be skipped\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of requestStatusTestCases) {
        console.log(`[TEST] ${testCase.name}`);
        console.log(`       ${testCase.description}`);
        
        try {
            let config = {
                method: testCase.method,
                url: `${BASE_URL}${testCase.url}`,
                validateStatus: () => true
            };
            
            if (testCase.requiresAuth) {
                if (token) {
                    config.headers = {
                        'Authorization': `Bearer ${token}`
                    };
                } else {
                    console.log('   [WARNING] Skipping authenticated test (no token available)\n');
                    continue;
                }
            }
            
            const response = await axios(config);
            
            if (response.status === testCase.expectedStatus) {
                console.log(`   [SUCCESS] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    console.log(`   [INFO] Retrieved ${response.data.data.length} request statuses`);
                    // Log some sample statuses if available
                    if (response.data.data.length > 0) {
                        const sampleStatus = response.data.data[0];
                        if (sampleStatus.Name) {
                            console.log(`   [INFO] Sample status: "${sampleStatus.Name}"`);
                        }
                    }
                } else if (response.data && response.data.message) {
                    console.log(`   [INFO] ${response.data.message}`);
                }
                passed++;
            } else {
                console.log(`   [ERROR] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                console.log(`   [ERROR] Response: ${JSON.stringify(response.data)}`);
                failed++;
            }
        } catch (error) {
            console.log(`   [ERROR] Request failed: ${error.message}`);
            if (error.response) {
                console.log(`   [ERROR] Status: ${error.response.status}`);
                console.log(`   [ERROR] Data: ${JSON.stringify(error.response.data)}`);
            }
            failed++;
        }
        
        console.log('');
    }
    
    console.log(`[INFO] Request Status API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runRequestStatusAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runRequestStatusAPITests };
