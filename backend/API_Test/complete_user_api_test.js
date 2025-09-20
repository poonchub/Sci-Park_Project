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
        name: "✅ Register - ข้อมูลถูกต้องครบทุกฟิลด์",
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
        name: "✅ Register - ข้อมูลถูกต้อง มีแค่ฟิลด์จำเป็น",
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
        name: "✅ Register - EmployeeID ว่าง (คนนอก)",
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
        name: "❌ Register - อีเมลผิดรูปแบบ",
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
        name: "❌ Register - รหัสผ่านสั้นเกินไป",
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
        name: "❌ Register - เบอร์โทรไม่ขึ้นต้นด้วย 0",
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
        name: "❌ Register - ไม่มีชื่อจริง",
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
    name: "🔑 Login - เข้าสู่ระบบ",
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
        name: "🔒 Get User By ID - ดูข้อมูลผู้ใช้",
        method: "GET",
        url: "/user/{userId}",
        needsAuth: true,
        expectedStatus: 200
    },
    {
        name: "🔒 Update User - แก้ไขข้อมูลผู้ใช้",
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
        name: "🔒 List Users (Admin) - ดูรายการผู้ใช้ทั้งหมด",
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
        console.log(`\n🧪 ${testCase.name}`);
        
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
            console.log(`✅ PASS - Status: ${response.status}`);
            if (response.data.message) {
                console.log(`📝 Message: ${response.data.message}`);
            }
            return { success: true, testCase: testCase.name, status: response.status, data: response.data };
        } else {
            console.log(`❌ FAIL - Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
            console.log(`📝 Response:`, response.data);
            return { success: false, testCase: testCase.name, reason: `Wrong status code`, expected: testCase.expectedStatus, actual: response.status };
        }
        
    } catch (error) {
        if (error.response && error.response.status === testCase.expectedStatus) {
            console.log(`✅ PASS - Status: ${error.response.status}`);
            if (error.response.data) {
                const errorMsg = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
                console.log(`📝 Error Message: ${errorMsg}`);
            }
            return { success: true, testCase: testCase.name, status: error.response.status };
        } else {
            console.log(`❌ FAIL - Error: ${error.message}`);
            if (error.response) {
                console.log(`📝 Response Status: ${error.response.status}`);
                console.log(`📝 Response Data:`, error.response.data);
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
        console.log('🔍 ตรวจสอบสถานะ Server...');
        const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
        console.log('✅ Server พร้อมใช้งาน');
        console.log(`📝 Response: ${response.data}`);
        return true;
    } catch (error) {
        console.log('❌ Server ไม่พร้อมใช้งาน');
        console.log('💡 กรุณาตรวจสอบ:');
        console.log('   1. Go server ทำงานอยู่หรือไม่? (go run main.go)');
        console.log('   2. Port 8000 ถูกต้องหรือไม่?');
        console.log(`   3. URL: ${BASE_URL}`);
        return false;
    }
}

// ===============================
// 🚀 MAIN TEST RUNNER
// ===============================

async function runAllTests() {
    console.log('🚀 เริ่มทดสอบ Complete User API Integration Tests');
    console.log('='.repeat(70));
    console.log(`📡 Base URL: ${BASE_URL}`);
    console.log('='.repeat(70));
    
    // 1. ตรวจสอบ Server
    const serverReady = await checkServerHealth();
    if (!serverReady) {
        console.log('\n⚠️  Server ไม่พร้อม - หยุดการทดสอบ');
        return;
    }

    const allResults = [];
    
    // 2. ทดสอบ Public APIs
    console.log('\n🌍 ทดสอบ PUBLIC APIs (ไม่ต้อง Token)');
    console.log('-'.repeat(50));
    
    for (let i = 0; i < publicApiTests.length; i++) {
        const testCase = publicApiTests[i];
        console.log(`\n[${i + 1}/${publicApiTests.length}]`);
        const result = await runTest(testCase);
        allResults.push(result);
        
        // เก็บ User ID จาก Register ที่สำเร็จ
        if (result.success && testCase.url === '/register' && result.data && result.data.user) {
            testUserId = result.data.user.ID || result.data.user.id;
            console.log(`💾 เก็บ Test User ID: ${testUserId}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. ทดสอบ Login
    console.log('\n🔑 ทดสอบ LOGIN');
    console.log('-'.repeat(50));
    
    const loginResult = await runTest(loginTest);
    allResults.push(loginResult);
    
    // เก็บ Token จาก Login
    if (loginResult.success && loginResult.data && loginResult.data.token) {
        authToken = loginResult.data.token;
        console.log(`🔑 เก็บ Auth Token: ${authToken.substring(0, 20)}...`);
    }
    
    // 4. ทดสอบ Protected APIs
    if (authToken) {
        console.log('\n🔒 ทดสอบ PROTECTED APIs (ต้องใช้ Token)');
        console.log('-'.repeat(50));
        
        for (let i = 0; i < protectedApiTests.length; i++) {
            const testCase = protectedApiTests[i];
            console.log(`\n[${i + 1}/${protectedApiTests.length}]`);
            
            if (testCase.needsAdmin) {
                console.log('⚠️  ข้าม: ต้องใช้ Admin Token (ไม่มีในการทดสอบนี้)');
                continue;
            }
            
            const result = await runTest(testCase, authToken);
            allResults.push(result);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } else {
        console.log('\n⚠️  ข้าม Protected APIs: ไม่มี Auth Token');
    }
    
    // 5. สรุปผลลัพธ์
    console.log('\n' + '='.repeat(70));
    console.log('📊 สรุปผลการทดสอบ Complete User API');
    console.log('='.repeat(70));
    
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    const successRate = ((passed / allResults.length) * 100).toFixed(2);
    
    console.log(`✅ ผ่าน: ${passed}/${allResults.length}`);
    console.log(`❌ ไม่ผ่าน: ${failed}/${allResults.length}`);
    console.log(`🎯 อัตราความสำเร็จ: ${successRate}%`);
    
    if (failed > 0) {
        console.log('\n❌ Test cases ที่ไม่ผ่าน:');
        allResults.filter(r => !r.success).forEach((r, index) => {
            console.log(`   ${index + 1}. ${r.testCase}`);
            console.log(`      Expected: ${r.expected}, Got: ${r.actual}`);
            console.log(`      Reason: ${r.reason}`);
        });
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (successRate == 100) {
        console.log('🎉 ยินดีด้วย! ทุก test cases ผ่านหมดแล้ว!');
    } else if (successRate >= 80) {
        console.log('👍 ผลการทดสอบดี มี test cases บางตัวที่ต้องแก้ไข');
    } else {
        console.log('⚠️  ต้องแก้ไข API หรือ test cases ให้มากขึ้น');
    }
    
    return allResults;
}

// รัน test
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, publicApiTests, protectedApiTests };
