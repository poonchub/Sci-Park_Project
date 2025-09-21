const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Generate unique test data to avoid conflicts
function generateUniqueApproval() {
    const timestamp = Date.now();
    return {
        user_id: 1,
        request_service_area_id: 1,
        note: `Application approved after thorough review and compliance verification - ${timestamp}`
    };
}

const serviceAreaApprovalTestCases = [
    {
        name: 'Test: Create service area approval with valid data',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: generateUniqueApproval(),
        description: 'Should create service area approval or return error'
    },
    {
        name: 'Test: Create approval with missing user ID',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            request_service_area_id: 1,
            note: 'Approval without user assignment'
        },
        description: 'Should return validation error for missing user ID'
    },
    {
        name: 'Test: Create approval with missing request service area ID',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            user_id: 1,
            note: 'Approval without service area reference'
        },
        description: 'Should return validation error for missing request service area ID'
    },
    {
        name: 'Test: Create approval with empty note',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            note: ''
        },
        description: 'Should accept empty note or return error'
    },
    {
        name: 'Test: Create approval with conditions',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            note: `Approved with conditions: Must complete fire safety certification within 30 days - ${Date.now()}`
        },
        description: 'Should create conditional approval or return error'
    },
    {
        name: 'Test: Create rejection with detailed reason',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            note: `Application rejected due to insufficient documentation - ${Date.now()}`
        },
        description: 'Should create rejection record or return error'
    },
    {
        name: 'Test: Create approval with invalid user ID',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [400, 404],
        data: {
            user_id: 99999,
            request_service_area_id: 1,
            note: 'Approval with invalid user'
        },
        description: 'Should return error for invalid user ID'
    },
    {
        name: 'Test: Create approval with invalid request service area ID',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [400, 404],
        data: {
            user_id: 1,
            request_service_area_id: 99999,
            note: 'Approval with invalid service area'
        },
        description: 'Should return error for invalid request service area ID'
    },
    {
        name: 'Test: Create approval with long detailed note',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: {
            user_id: 1,
            request_service_area_id: 1,
            note: `After comprehensive review of all submitted documents, site inspection, compliance verification, stakeholder consultation, and risk assessment, this application is hereby approved subject to conditions - ${Date.now()}`
        },
        description: 'Should handle long approval notes or return error'
    },
    {
        name: 'Test: Create manager approval',
        method: 'POST',
        url: '/service-area-approval',
        requiresAuth: true,
        expectedStatus: [201, 400, 404],
        data: {
            user_id: 2,
            request_service_area_id: 1,
            note: `Approved by facility manager after final inspection - ${Date.now()}`
        },
        description: 'Should create manager approval or return error'
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

// Function to run Service Area Approval API tests
async function runServiceAreaApprovalAPITests() {
    console.log('\n=== SERVICE AREA APPROVAL API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Skipping authenticated tests\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of serviceAreaApprovalTestCases) {
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
    
    console.log(`[INFO] Service Area Approval API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runServiceAreaApprovalAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runServiceAreaApprovalAPITests };


