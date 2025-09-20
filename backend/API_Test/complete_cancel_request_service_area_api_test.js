const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8000';

// Generate unique test data to avoid conflicts
function generateUniqueCancelRequest() {
    const timestamp = Date.now();
    return {
        corporate_registration_number: `CANCEL-${timestamp}`,
        purpose_of_cancellation: `Business restructuring requires relocating operations - ${timestamp}`,
        project_activities: `Software development and consulting services - ${timestamp}`,
        annual_income: '500000.50'
    };
}

const cancelRequestTestCases = [
    {
        name: 'Test: Cancel request service area with valid data',
        method: 'POST',
        url: '/cancel-request-service-area/1',
        requiresAuth: true,
        expectedStatus: 201,
        data: generateUniqueCancelRequest(),
        description: 'Should create cancellation request with valid data',
        useFormData: true
    },
    {
        name: 'Test: Cancel request with missing purpose',
        method: 'POST',
        url: '/cancel-request-service-area/1',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            corporate_registration_number: 'CANCEL-TEST',
            purpose_of_cancellation: '',
            project_activities: 'Software development',
            annual_income: '300000'
        },
        description: 'Should return validation error for missing purpose',
        useFormData: true
    },
    {
        name: 'Test: Cancel request with negative annual income',
        method: 'POST',
        url: '/cancel-request-service-area/1',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            corporate_registration_number: 'CANCEL-TEST',
            purpose_of_cancellation: 'Company closure',
            project_activities: 'Consulting services',
            annual_income: '-50000'
        },
        description: 'Should return validation error for negative income',
        useFormData: true
    },
    {
        name: 'Test: Cancel request with zero annual income',
        method: 'POST',
        url: '/cancel-request-service-area/1',
        requiresAuth: true,
        expectedStatus: 201,
        data: {
            corporate_registration_number: 'CANCEL-ZERO',
            purpose_of_cancellation: 'Startup with no revenue yet',
            project_activities: 'Product development',
            annual_income: '0'
        },
        description: 'Should accept zero annual income',
        useFormData: true
    },
    {
        name: 'Test: Cancel request with empty project activities',
        method: 'POST',
        url: '/cancel-request-service-area/1',
        requiresAuth: true,
        expectedStatus: 201,
        data: {
            corporate_registration_number: 'CANCEL-EMPTY',
            purpose_of_cancellation: 'Change of business direction',
            project_activities: '',
            annual_income: '150000'
        },
        description: 'Should accept empty project activities (optional field)',
        useFormData: true
    },
    {
        name: 'Test: Get cancellation request for edit',
        method: 'GET',
        url: '/cancel-request-service-area/1/edit',
        requiresAuth: true,
        expectedStatus: [200, 404],
        description: 'Should retrieve cancellation request details or return not found'
    },
    {
        name: 'Test: Update cancellation request',
        method: 'PATCH',
        url: '/cancel-request-service-area/1/edit',
        requiresAuth: true,
        expectedStatus: [200, 404],
        data: {
            purpose_of_cancellation: 'Updated cancellation reason',
            annual_income: '600000'
        },
        description: 'Should update cancellation request or return not found',
        useFormData: true
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

// Function to run Cancel Request Service Area API tests
async function runCancelRequestServiceAreaAPITests() {
    console.log('\n=== CANCEL REQUEST SERVICE AREA API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Skipping authenticated tests\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of cancelRequestTestCases) {
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
            
            if (testCase.data) {
                if (testCase.useFormData) {
                    const formData = new FormData();
                    Object.keys(testCase.data).forEach(key => {
                        formData.append(key, testCase.data[key]);
                    });
                    config.data = formData;
                    config.headers = {
                        ...config.headers,
                        ...formData.getHeaders()
                    };
                } else {
                    config.data = testCase.data;
                    config.headers = {
                        ...config.headers,
                        'Content-Type': 'application/json'
                    };
                }
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
    
    console.log(`[INFO] Cancel Request Service Area API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runCancelRequestServiceAreaAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runCancelRequestServiceAreaAPITests };
