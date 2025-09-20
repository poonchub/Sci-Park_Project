const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:8000';

// Generate unique test data to avoid conflicts
function generateUniqueRequestServiceArea() {
    const timestamp = Date.now();
    return {
        purpose_of_using_space: `Office space for innovative startup company - ${timestamp}`,
        number_of_employees: '15',
        activities_in_building: `Software development, research, and client meetings - ${timestamp}`,
        supporting_activities_for_science_park: `Technology transfer and startup mentoring programs - ${timestamp}`,
        collaboration_plan: [`Joint research project - ${timestamp}`],
        collaboration_budgets: ['250000'],
        project_start_dates: ['2024-06-01'],
        corporate_registration_number: `REG-${timestamp}`,
        business_group_id: '1',
        company_size_id: '2',
        main_services: `Software consulting and development - ${timestamp}`,
        registered_capital: '1000000',
        hiring_rate: '5',
        research_investment_value: '500000',
        three_year_growth_forecast: `Expected 300% growth in technology sector - ${timestamp}`
    };
}

const requestServiceAreaTestCases = [
    {
        name: 'Test: Get all request service areas',
        method: 'GET',
        url: '/request-service-areas',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should retrieve list of all request service areas'
    },
    {
        name: 'Test: Create request service area with valid data',
        method: 'POST',
        url: '/request-service-area/1',
        requiresAuth: true,
        expectedStatus: 201,
        data: generateUniqueRequestServiceArea(),
        description: 'Should create new request service area with valid data',
        useFormData: true
    },
    {
        name: 'Test: Create request service area with missing purpose',
        method: 'POST',
        url: '/request-service-area/1',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            purpose_of_using_space: '',
            number_of_employees: '10',
            activities_in_building: 'Software development',
            supporting_activities_for_science_park: 'Innovation programs'
        },
        description: 'Should return validation error for missing purpose',
        useFormData: true
    },
    {
        name: 'Test: Create request service area with zero employees',
        method: 'POST',
        url: '/request-service-area/1',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            purpose_of_using_space: 'Office space for startup',
            number_of_employees: '0',
            activities_in_building: 'Research and development',
            supporting_activities_for_science_park: 'Innovation programs'
        },
        description: 'Should return validation error for zero employees',
        useFormData: true
    },
    {
        name: 'Test: Create request service area with missing activities',
        method: 'POST',
        url: '/request-service-area/1',
        requiresAuth: true,
        expectedStatus: 400,
        data: {
            purpose_of_using_space: 'Office space for startup',
            number_of_employees: '10',
            activities_in_building: '',
            supporting_activities_for_science_park: 'Innovation programs'
        },
        description: 'Should return validation error for missing activities',
        useFormData: true
    },
    {
        name: 'Test: Get request service area by user ID',
        method: 'GET',
        url: '/request-service-area/1',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should retrieve request service area for specific user'
    },
    {
        name: 'Test: Get request service area with invalid user ID',
        method: 'GET',
        url: '/request-service-area/99999',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Should return empty array for non-existent user'
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

// Function to run Request Service Area API tests
async function runRequestServiceAreaAPITests() {
    console.log('\n=== REQUEST SERVICE AREA API TESTS ===\n');
    
    let token = null;
    try {
        token = await login();
    } catch (error) {
        console.log('[WARNING] Could not obtain authentication token');
        console.log('[INFO] Skipping authenticated tests\n');
    }
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of requestServiceAreaTestCases) {
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
                        if (Array.isArray(testCase.data[key])) {
                            testCase.data[key].forEach((value, index) => {
                                formData.append(`${key}[]`, value);
                            });
                        } else {
                            formData.append(key, testCase.data[key]);
                        }
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
            
            if (response.status === testCase.expectedStatus) {
                console.log(`   [SUCCESS] Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
                if (response.data) {
                    if (response.data.data && Array.isArray(response.data.data)) {
                        console.log(`   [INFO] Retrieved ${response.data.data.length} records`);
                    } else if (response.data.message) {
                        console.log(`   [INFO] ${response.data.message}`);
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
    
    console.log(`[INFO] Request Service Area API Tests completed`);
    console.log(`[INFO] Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}\n`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runRequestServiceAreaAPITests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('[ERROR] Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runRequestServiceAreaAPITests };
