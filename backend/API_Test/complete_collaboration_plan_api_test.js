const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

const collaborationPlanTestCases = [
    {
        name: 'Test: Get collaboration plans (via request service areas)',
        method: 'GET',
        url: '/request-service-areas',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should retrieve request service areas with collaboration plans'
    },
    {
        name: 'Test: Get specific request service area with collaboration plans',
        method: 'GET',
        url: '/request-service-area/1',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should retrieve specific request service area with its collaboration plans'
    },
    {
        name: 'Test: Get request service areas by user',
        method: 'GET',
        url: '/request-service-areas/user/1',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should retrieve user-specific request service areas with collaboration plans'
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

// Function to run Collaboration Plan API tests
async function runCollaborationPlanAPITests() {
    console.log('\n=== COLLABORATION PLAN API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Skipping authenticated tests\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of collaborationPlanTestCases) {
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
                if (response.data && response.data.data) {
                    if (Array.isArray(response.data.data)) {
                        console.log(`   [INFO] Retrieved ${response.data.data.length} records`);
                        // Check if any records have collaboration plans
                        const withPlans = response.data.data.filter(item => 
                            item.CollaborationPlans && item.CollaborationPlans.length > 0
                        );
                        if (withPlans.length > 0) {
                            console.log(`   [INFO] Found ${withPlans.length} records with collaboration plans`);
                        }
                    } else if (response.data.data.CollaborationPlans) {
                        console.log(`   [INFO] Found ${response.data.data.CollaborationPlans.length} collaboration plans`);
                    }
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
    
    console.log(`[INFO] Collaboration Plan API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runCollaborationPlanAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runCollaborationPlanAPITests };
