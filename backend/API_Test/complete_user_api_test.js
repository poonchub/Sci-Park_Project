const axios = require('axios');

// กำหนด Base URL ของ API
const BASE_URL = 'http://localhost:8000';

// ตัวแปรสำหรับเก็บ Token และ User ID
let authToken = '';
let testUserId = '';

// ===============================
// 🌍 PUBLIC API TEST CASES
// ===============================

const publicApiTests = [
    {
        name: "Test: Register - Valid data with all fields",
        method: "POST",
        url: "/register",
        data: {
            CompanyName: "Test Company",
            EmployeeID: "123456",
            BusinessDetail: "Software Development",
            FirstName: "John",
            LastName: "Doe",
            Email: "john.doe.test@example.com",
            Password: "SecurePass123!",
            Phone: "0812345678",
            IsEmployee: true,
            IsBusinessOwner: false,
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 201
    },
    {
        name: "Test: Register - Valid data with required fields only",
        method: "POST", 
        url: "/register",
        data: {
            FirstName: "Jane",
            LastName: "Smith",
            Email: "jane.smith.test@example.com",
            Password: "SecurePass123!",
            Phone: "0887654321",
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 201
    },
    {
        name: "Test: Register - Empty EmployeeID (External user)",
        method: "POST",
        url: "/register",
        data: {
            CompanyName: "External Company",
            EmployeeID: "",
            FirstName: "External",
            LastName: "User",
            Email: "external.user.test@example.com",
            Password: "SecurePass123!",
            Phone: "0891234567",
            IsEmployee: false,
            IsBusinessOwner: true,
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 201
    },
    {
        name: "Test: Register - Invalid email format",
        method: "POST",
        url: "/register",
        data: {
            FirstName: "John",
            LastName: "Doe",
            Email: "invalid-email-format",
            Password: "SecurePass123!",
            Phone: "0812345678",
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 400
    },
    {
        name: "Test: Register - Password too short",
        method: "POST",
        url: "/register",
        data: {
            FirstName: "John",
            LastName: "Doe",
            Email: "short.pass.test@example.com",
            Password: "Short1!",
            Phone: "0812345678",
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 400
    },
    {
        name: "Test: Register - Phone number not starting with 0",
        method: "POST",
        url: "/register",
        data: {
            FirstName: "John",
            LastName: "Doe",
            Email: "invalid.phone.test@example.com",
            Password: "SecurePass123!",
            Phone: "1812345678",
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 400
    },
    {
        name: "Test: Register - Missing first name",
        method: "POST",
        url: "/register",
        data: {
            LastName: "Doe",
            Email: "no.firstname.test@example.com",
            Password: "SecurePass123!",
            Phone: "0812345678",
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 400
    }
];

// ===============================
// 🔑 LOGIN TEST
// ===============================

const loginTest = {
    name: "Test: Login - User authentication",
    method: "POST",
    url: "/auth/login",
    data: {
        Email: "john.doe.test@example.com",
        Password: "SecurePass123!"
    },
    expectedStatus: 200
};

// ===============================
// 🔒 PROTECTED API TEST CASES
// ===============================

const protectedApiTests = [
    {
        name: "Test: Get User By ID - View user data",
        method: "GET",
        url: "/user/{userId}",
        needsAuth: true,
        expectedStatus: 200
    },
    {
        name: "Test: Update User - Modify user data",
        method: "PATCH",
        url: "/user/{userId}",
        needsAuth: true,
        data: {
            FirstName: "Updated John",
            LastName: "Updated Doe"
        },
        expectedStatus: 200
    },
    {
        name: "Test: List Users (Admin) - View all users",
        method: "GET",
        url: "/users",
        needsAuth: true,
        needsAdmin: true,
        expectedStatus: 200
    }
];

// ===============================
// 🧪 HELPER FUNCTIONS
// ===============================

async function runTest(testCase, token = null) {
    try {
        console.log(`\n[TEST] ${testCase.name}`);
        
        // เตรียม URL (แทนที่ {userId} ด้วย testUserId)
        let url = testCase.url;
        if (url.includes('{userId}') && testUserId) {
            url = url.replace('{userId}', testUserId);
        }
        
        const config = {
            method: testCase.method,
            url: `${BASE_URL}${url}`,
            headers: {},
            timeout: 10000
        };

        // เพิ่ม Authorization header ถ้าต้องการ
        if (testCase.needsAuth && token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // เพิ่ม data ถ้ามี - แปลงเป็น FormData สำหรับ /register
        if (testCase.data) {
            if (testCase.url === '/register') {
                // ใช้ FormData สำหรับ register API
                const FormData = require('form-data');
                const formData = new FormData();
                
                // แปลง object เป็น form fields
                Object.keys(testCase.data).forEach(key => {
                    let value = testCase.data[key];
                    
                    // แปลง field names ให้ตรงกับ API
                    let fieldName = key;
                    if (key === 'CompanyName') fieldName = 'company_name';
                    else if (key === 'BusinessDetail') fieldName = 'business_detail';
                    else if (key === 'FirstName') fieldName = 'first_name';
                    else if (key === 'LastName') fieldName = 'last_name';
                    else if (key === 'Email') fieldName = 'email';
                    else if (key === 'Password') fieldName = 'password';
                    else if (key === 'Phone') fieldName = 'phone';
                    else if (key === 'EmployeeID') fieldName = 'employee_id';
                    else if (key === 'IsEmployee') fieldName = 'is_employee';
                    else if (key === 'IsBusinessOwner') fieldName = 'is_business_owner';
                    else if (key === 'RoleID') fieldName = 'role_id';
                    else if (key === 'JobPositionID') fieldName = 'job_position_id';
                    else if (key === 'GenderID') fieldName = 'gender_id';
                    else if (key === 'RequestTypeID') fieldName = 'request_type_id';
                    else if (key === 'PrefixID') fieldName = 'prefix_id';
                    
                    formData.append(fieldName, String(value));
                });
                
                config.data = formData;
                config.headers = { ...config.headers, ...formData.getHeaders() };
            } else {
                // ใช้ JSON สำหรับ API อื่นๆ
                config.data = testCase.data;
                config.headers['Content-Type'] = 'application/json';
            }
        }

        const response = await axios(config);
        
        if (response.status === testCase.expectedStatus) {
            console.log(`[SUCCESS] PASS - Status: ${response.status}`);
            if (response.data.message) {
                console.log(`[INFO] Message: ${response.data.message}`);
            }
            return { success: true, testCase: testCase.name, status: response.status, data: response.data };
        } else {
            console.log(`[ERROR] FAIL - Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
            console.log(`[INFO] Response:`, response.data);
            return { success: false, testCase: testCase.name, reason: `Wrong status code`, expected: testCase.expectedStatus, actual: response.status };
        }
        
    } catch (error) {
        if (error.response && error.response.status === testCase.expectedStatus) {
            console.log(`[SUCCESS] PASS - Status: ${error.response.status}`);
            if (error.response.data) {
                const errorMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
                console.log(`[INFO] Error Message: ${errorMsg}`);
            }
            return { success: true, testCase: testCase.name, status: error.response.status };
        } else {
            console.log(`[ERROR] FAIL - Error: ${error.message}`);
            if (error.response) {
                console.log(`[INFO] Response Status: ${error.response.status}`);
                console.log(`[INFO] Response Data:`, error.response.data);
            }
            return { 
                success: false, 
                testCase: testCase.name, 
                reason: error.message,
                expected: testCase.expectedStatus,
                actual: error.response ? error.response.status : 'No response'
            };
        }
    }
}

async function checkServerHealth() {
    try {
        console.log('[INFO] Checking server status...');
        const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
        console.log('[SUCCESS] Server is ready');
        console.log(`[INFO] Response: ${response.data}`);
        return true;
    } catch (error) {
        console.log('[ERROR] Server is not ready');
        console.log('[INFO] Please check:');
        console.log('   1. Go server is running? (go run main.go)');
        console.log('   2. Port 8000 is correct?');
        console.log(`   3. URL: ${BASE_URL}`);
        return false;
    }
}

// ===============================
// 🚀 MAIN TEST RUNNER
// ===============================

async function runAllTests() {
    console.log('USER API INTEGRATION TESTS');
    console.log('='.repeat(70));
    console.log(`[INFO] Base URL: ${BASE_URL}`);
    console.log('='.repeat(70));
    
    // 1. ตรวจสอบ Server
    const serverReady = await checkServerHealth();
    if (!serverReady) {
        console.log('\n[WARNING] Server not ready - stopping tests');
        return;
    }

    const allResults = [];
    
    // 2. ทดสอบ Public APIs
    console.log('\n[INFO] Testing PUBLIC APIs (no token required)');
    console.log('-'.repeat(50));
    
    for (let i = 0; i < publicApiTests.length; i++) {
        const testCase = publicApiTests[i];
        console.log(`\n[${i + 1}/${publicApiTests.length}]`);
        const result = await runTest(testCase);
        allResults.push(result);
        
        // เก็บ User ID จาก Register ที่สำเร็จ
        if (result.success && testCase.url === '/register' && result.data && result.data.user) {
            testUserId = result.data.user.ID || result.data.user.id;
            console.log(`[INFO] Saved Test User ID: ${testUserId}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. ทดสอบ Login
    console.log('\n[INFO] Testing LOGIN');
    console.log('-'.repeat(50));
    
    const loginResult = await runTest(loginTest);
    allResults.push(loginResult);
    
    // เก็บ Token จาก Login
    if (loginResult.success && loginResult.data && loginResult.data.token) {
        authToken = loginResult.data.token;
        console.log(`[INFO] Saved Auth Token: ${authToken.substring(0, 20)}...`);
    }
    
    // 4. ทดสอบ Protected APIs
    if (authToken) {
        console.log('\n[INFO] Testing PROTECTED APIs (token required)');
        console.log('-'.repeat(50));
        
        for (let i = 0; i < protectedApiTests.length; i++) {
            const testCase = protectedApiTests[i];
            console.log(`\n[${i + 1}/${protectedApiTests.length}]`);
            
            if (testCase.needsAdmin) {
                console.log('[WARNING] Skip: Requires Admin Token (not available in this test)');
                continue;
            }
            
            const result = await runTest(testCase, authToken);
            allResults.push(result);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } else {
        console.log('\n[WARNING] Skip Protected APIs: No Auth Token');
    }
    
    // 5. สรุปผลลัพธ์
    console.log('\n' + '='.repeat(70));
    console.log('USER API TEST SUMMARY');
    console.log('='.repeat(70));
    
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    const successRate = ((passed / allResults.length) * 100).toFixed(2);
    
    console.log(`[SUCCESS] Passed: ${passed}/${allResults.length}`);
    console.log(`[ERROR] Failed: ${failed}/${allResults.length}`);
    console.log(`[INFO] Success Rate: ${successRate}%`);
    
    if (failed > 0) {
        console.log('\n[ERROR] Failed test cases:');
        allResults.filter(r => !r.success).forEach((r, index) => {
            console.log(`   ${index + 1}. ${r.testCase}`);
            console.log(`      Expected: ${r.expected}, Got: ${r.actual}`);
            console.log(`      Reason: ${r.reason}`);
        });
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (successRate == 100) {
        console.log('[SUCCESS] Congratulations! All test cases passed!');
    } else if (successRate >= 80) {
        console.log('[SUCCESS] Good test results, some test cases need fixing');
    } else {
        console.log('[WARNING] Need to fix API or test cases');
    }
    
    return allResults;
}

// รัน test
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, publicApiTests, protectedApiTests };
