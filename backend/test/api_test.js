const axios = require('axios');

// กำหนด Base URL ของ API
const BASE_URL = 'http://localhost:8080'; // เปลี่ยนตาม port ที่ใช้

// Test Cases สำหรับ User API
const userTestCases = [
    {
        name: "✅ Valid User - ข้อมูลถูกต้องครบ",
        method: "POST",
        url: "/users",
        data: {
            CompanyName: "Test Company",
            EmployeeID: "123456",
            BusinessDetail: "Software Development",
            FirstName: "John",
            LastName: "Doe",
            Email: "john.doe@example.com",
            Password: "SecurePass123!",
            Phone: "0812345678",
            RoleID: 1,
            JobPositionID: 1,
            GenderID: 1,
            RequestTypeID: 1,
            PrefixID: 1
        },
        expectedStatus: 201 // หรือ 200 ตามที่ API กำหนด
    },
    {
        name: "❌ Invalid Email - อีเมลผิดรูปแบบ",
        method: "POST",
        url: "/users",
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
        name: "❌ Invalid Password - รหัสผ่านสั้นเกินไป",
        method: "POST",
        url: "/users",
        data: {
            FirstName: "John",
            LastName: "Doe",
            Email: "john.doe@example.com",
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
        name: "❌ Invalid Phone - เบอร์โทรไม่ขึ้นต้นด้วย 0",
        method: "POST",
        url: "/users",
        data: {
            FirstName: "John",
            LastName: "Doe",
            Email: "john.doe@example.com",
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
        name: "❌ Invalid EmployeeID - มีตัวอักษร",
        method: "POST",
        url: "/users",
        data: {
            CompanyName: "Test Company",
            EmployeeID: "12345A",
            FirstName: "John",
            LastName: "Doe",
            Email: "john.doe@example.com",
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
        name: "❌ Missing Required Field - ไม่มีชื่อจริง",
        method: "POST",
        url: "/users",
        data: {
            LastName: "Doe",
            Email: "john.doe@example.com",
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

// ฟังก์ชันสำหรับรัน test
async function runTest(testCase) {
    try {
        console.log(`\n🧪 ${testCase.name}`);
        
        const config = {
            method: testCase.method,
            url: `${BASE_URL}${testCase.url}`,
            data: testCase.data,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const response = await axios(config);
        
        if (response.status === testCase.expectedStatus) {
            console.log(`✅ PASS - Status: ${response.status}`);
            return { success: true, testCase: testCase.name };
        } else {
            console.log(`❌ FAIL - Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
            return { success: false, testCase: testCase.name, reason: `Wrong status code` };
        }
        
    } catch (error) {
        if (error.response && error.response.status === testCase.expectedStatus) {
            console.log(`✅ PASS - Status: ${error.response.status}`);
            console.log(`📝 Error Message: ${error.response.data.message || error.response.data.error || 'No message'}`);
            return { success: true, testCase: testCase.name };
        } else {
            console.log(`❌ FAIL - Error: ${error.message}`);
            if (error.response) {
                console.log(`📝 Response Status: ${error.response.status}`);
                console.log(`📝 Response Data:`, error.response.data);
            }
            return { success: false, testCase: testCase.name, reason: error.message };
        }
    }
}

// ฟังก์ชันหลักสำหรับรัน test ทั้งหมด
async function runAllTests() {
    console.log('🚀 เริ่มทดสอบ User API...\n');
    console.log(`📡 Base URL: ${BASE_URL}`);
    
    const results = [];
    
    for (const testCase of userTestCases) {
        const result = await runTest(testCase);
        results.push(result);
        
        // รอ 500ms ระหว่าง test เพื่อไม่ให้ server ทำงานหนักเกินไป
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // สรุปผลลัพธ์
    console.log('\n' + '='.repeat(50));
    console.log('📊 สรุปผลการทดสอบ');
    console.log('='.repeat(50));
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ ผ่าน: ${passed}/${results.length}`);
    console.log(`❌ ไม่ผ่าน: ${failed}/${results.length}`);
    
    if (failed > 0) {
        console.log('\n❌ Test cases ที่ไม่ผ่าน:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.testCase}: ${r.reason}`);
        });
    }
    
    console.log(`\n🎯 Success Rate: ${((passed / results.length) * 100).toFixed(2)}%`);
}

// รัน test
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, userTestCases };
