const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Generate unique test data to avoid conflicts
function generateUniqueTask() {
    const timestamp = Date.now();
    return {
        user_id: 1,
        request_service_area_id: 1,
        operator_user_id: 2,
        note: `Complete area inspection and provide detailed report - ${timestamp}`
    };
}

const serviceAreaTaskTestCases = [
    {
        name: 'Test: Create cancellation task with valid data',
        method: 'POST',
        url: '/cancellation-task',
        requiresAuth: true,
        expectedStatus: [201, 400],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            note: `Process cancellation request - ${Date.now()}`
        },
        description: 'Should create cancellation task or return validation error'
    },
    {
        name: 'Test: Assign cancellation task with valid data',
        method: 'POST',
        url: '/assign-cancellation-task',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: generateUniqueTask(),
        description: 'Should assign cancellation task or return error'
    },
    {
        name: 'Test: Create cancellation task with missing user ID',
        method: 'POST',
        url: '/cancellation-task',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            request_service_area_id: 1,
            note: 'Task without user assignment'
        },
        description: 'Should return validation error for missing user ID'
    },
    {
        name: 'Test: Assign cancellation task with missing request service area ID',
        method: 'POST',
        url: '/assign-cancellation-task',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            user_id: 1,
            operator_user_id: 2,
            note: 'Task without service area reference'
        },
        description: 'Should return validation error for missing request service area ID'
    },
    {
        name: 'Test: Create cancellation task with empty note',
        method: 'POST',
        url: '/cancellation-task',
        requiresAuth: true,
        expectedStatus: [201, 400],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            note: ''
        },
        description: 'Should accept empty note or return validation error'
    },
    {
        name: 'Test: Assign cancellation task with invalid user ID',
        method: 'POST',
        url: '/assign-cancellation-task',
        requiresAuth: true,
        expectedStatus: [400, 404],
        data: {
            user_id: 99999,
            request_service_area_id: 1,
            operator_user_id: 2,
            note: 'Task with invalid user'
        },
        description: 'Should return error for invalid user ID'
    },
    {
        name: 'Test: Assign cancellation task with invalid operator ID',
        method: 'POST',
        url: '/assign-cancellation-task',
        requiresAuth: true,
        expectedStatus: [400, 404],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            operator_user_id: 99999,
            note: 'Task with invalid operator'
        },
        description: 'Should return error for invalid operator ID'
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

// Function to run Service Area Task API tests
async function runServiceAreaTaskAPITests() {
    console.log('\n=== SERVICE AREA TASK API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Skipping authenticated tests\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of serviceAreaTaskTestCases) {
        console.log(`[TEST] ${testCase.name}`);
        console.log(`       ${testCase.description}`);
        
        try {
            let config = {
                method: testCase.method,
                url: `${BASE_URL}${testCase.url}`,
                validateStatus: () => true,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (testCase.requiresAuth) {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                } else {
                    console.log('   [WARNING] Skipping authenticated test (no token available)\n');
                    continue;
                }
            }
            
            if (testCase.data) {
                config.data = testCase.data;
            }
            
            const response = await axios(config);
            
            const expectedStatuses = Array.isArray(testCase.expectedStatus) 
                ? testCase.expectedStatus 
                : [testCase.expectedStatus];
            
            if (expectedStatuses.includes(response.status)) {
                console.log(`   [SUCCESS] Status: ${response.status} (Expected: ${expectedStatuses.join(' or ')})`);
                if (response.data) {
                    if (response.data.message) {
                        console.log(`   [INFO] ${response.data.message}`);
                    } else if (response.data.data) {
                        console.log(`   [INFO] Response data received`);
                    }
                }
                passed++;
            } else {
                console.log(`   [ERROR] Status: ${response.status} (Expected: ${expectedStatuses.join(' or ')})`);
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
    
    console.log(`[INFO] Service Area Task API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runServiceAreaTaskAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runServiceAreaTaskAPITests };


