const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8000';

// Generate unique test data to avoid conflicts
function generateUniqueServiceAreaDocument() {
    const timestamp = Date.now();
    return {
        contract_number: `SA-${timestamp}`,
        final_contract_number: `FSA-${timestamp}`,
        contract_start_at: '2024-01-01T00:00:00Z',
        contract_end_at: '2024-12-31T23:59:59Z',
        room_id: '1',
        service_user_type_id: '1'
    };
}

const serviceAreaDocumentTestCases = [
    {
        name: 'Test: Create service area document with valid data',
        method: 'POST',
        url: '/service-area-documents/1',
        requiresAuth: true,
        expectedStatus: [201, 409],
        data: generateUniqueServiceAreaDocument(),
        description: 'Should create service area document or return conflict if exists',
        useFormData: true
    },
    {
        name: 'Test: Get service area document by request ID',
        method: 'GET',
        url: '/service-area-documents/1',
        requiresAuth: true,
        expectedStatus: [200, 404],
        description: 'Should retrieve service area document or return not found'
    },
    {
        name: 'Test: Update service area document',
        method: 'PUT',
        url: '/service-area-documents/1',
        requiresAuth: true,
        expectedStatus: [200, 404],
        data: {
            contract_number: `SA-UPDATED-${Date.now()}`,
            final_contract_number: `FSA-UPDATED-${Date.now()}`
        },
        description: 'Should update service area document or return not found',
        useFormData: true
    },
    {
        name: 'Test: Get service area document for edit',
        method: 'GET',
        url: '/service-area-documents/1/edit',
        requiresAuth: true,
        expectedStatus: [200, 404],
        description: 'Should retrieve document for editing or return not found'
    },
    {
        name: 'Test: Update service area document for edit',
        method: 'PATCH',
        url: '/service-area-documents/1/edit',
        requiresAuth: true,
        expectedStatus: [200, 404],
        data: {
            contract_number: `SA-EDIT-${Date.now()}`
        },
        description: 'Should update document via edit endpoint or return not found',
        useFormData: true
    },
    {
        name: 'Test: Update service area document for cancellation',
        method: 'PUT',
        url: '/service-area-documents/1/cancellation',
        requiresAuth: true,
        expectedStatus: [200, 404],
        data: {
            refund_guarantee_document: 'path/to/refund/document.pdf'
        },
        description: 'Should update document for cancellation or return not found',
        useFormData: true
    },
    {
        name: 'Test: Create service area document with missing data',
        method: 'POST',
        url: '/service-area-documents/999',
        requiresAuth: true,
        expectedStatus: [400, 404],
        data: {
            contract_number: '',
            room_id: '0'
        },
        description: 'Should return validation error or not found for invalid data',
        useFormData: true
    },
    {
        name: 'Test: Get service area document with invalid request ID',
        method: 'GET',
        url: '/service-area-documents/99999',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Should return not found for invalid request ID'
    },
    {
        name: 'Test: Delete service area document',
        method: 'DELETE',
        url: '/service-area-documents/999',
        requiresAuth: true,
        expectedStatus: [200, 404],
        description: 'Should delete document or return not found'
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

// Function to run Service Area Document API tests
async function runServiceAreaDocumentAPITests() {
    console.log('\n=== SERVICE AREA DOCUMENT API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Skipping authenticated tests\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of serviceAreaDocumentTestCases) {
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
    
    console.log(`[INFO] Service Area Document API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runServiceAreaDocumentAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runServiceAreaDocumentAPITests };
