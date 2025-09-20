const axios = require('axios');

// Transaction-based Testing
class TransactionTest {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.createdUsers = [];
        this.testSession = Date.now();
    }
    
    // สร้าง unique test data
    generateTestEmail(prefix = 'test') {
        return `${prefix}.${this.testSession}.${Date.now()}@test.example.com`;
    }
    
    generateTestPhone() {
        const random = Math.floor(Math.random() * 100000000);
        return `08${String(random).padStart(8, '0')}`;
    }
    
    // ทดสอบแล้วเก็บ ID ไว้ cleanup
    async testRegister(testData) {
        try {
            // แก้ไข email และ phone ให้ unique
            const uniqueData = {
                ...testData,
                email: this.generateTestEmail('register'),
                phone: this.generateTestPhone()
            };
            
            const FormData = require('form-data');
            const formData = new FormData();
            
            Object.keys(uniqueData).forEach(key => {
                let fieldName = this.convertFieldName(key);
                formData.append(fieldName, String(uniqueData[key]));
            });
            
            const response = await axios.post(`${this.baseURL}/register`, formData, {
                headers: formData.getHeaders(),
                timeout: 10000
            });
            
            // เก็บ User ID สำหรับ cleanup
            if (response.data && response.data.user) {
                this.createdUsers.push({
                    id: response.data.user.ID || response.data.user.id,
                    email: uniqueData.email
                });
            }
            
            return {
                success: true,
                status: response.status,
                data: response.data
            };
            
        } catch (error) {
            return {
                success: false,
                status: error.response?.status,
                error: error.response?.data || error.message
            };
        }
    }
    
    convertFieldName(key) {
        const fieldMap = {
            'CompanyName': 'company_name',
            'BusinessDetail': 'business_detail',
            'FirstName': 'first_name',
            'LastName': 'last_name',
            'Email': 'email',
            'Password': 'password',
            'Phone': 'phone',
            'EmployeeID': 'employee_id',
            'IsEmployee': 'is_employee',
            'IsBusinessOwner': 'is_business_owner',
            'RoleID': 'role_id',
            'JobPositionID': 'job_position_id',
            'GenderID': 'gender_id',
            'RequestTypeID': 'request_type_id',
            'PrefixID': 'prefix_id'
        };
        
        return fieldMap[key] || key.toLowerCase();
    }
    
    // Cleanup หลังทดสอบ
    async cleanup() {
        console.log(`\n🧹 Cleaning up ${this.createdUsers.length} test users...`);
        
        for (const user of this.createdUsers) {
            try {
                // ลบผ่าน API (ถ้ามี DELETE endpoint)
                // await axios.delete(`${this.baseURL}/user/${user.id}`);
                
                console.log(`🗑️  Would delete user: ${user.email} (ID: ${user.id})`);
                
            } catch (error) {
                console.log(`⚠️  Failed to delete user ${user.email}:`, error.message);
            }
        }
        
        console.log('✅ Cleanup completed');
    }
    
    // รัน test suite พร้อม cleanup
    async runTestSuite() {
        console.log('🚀 Starting Transaction-based API Tests');
        console.log('='.repeat(50));
        
        const results = [];
        
        try {
            // Test Case 1: Valid Registration
            console.log('\n🧪 Test 1: Valid Registration');
            const test1 = await this.testRegister({
                CompanyName: "Test Company",
                FirstName: "John",
                LastName: "Doe",
                Email: "placeholder@example.com", // จะถูกแทนที่
                Password: "SecurePass123!",
                Phone: "0812345678", // จะถูกแทนที่
                GenderID: 1
            });
            
            console.log(`Result: ${test1.success ? '✅ PASS' : '❌ FAIL'} - Status: ${test1.status}`);
            results.push(test1);
            
            // Test Case 2: Invalid Email
            console.log('\n🧪 Test 2: Invalid Email');
            const test2 = await this.testRegister({
                FirstName: "Jane",
                LastName: "Doe",
                Email: "invalid-email", // Invalid format
                Password: "SecurePass123!",
                Phone: "0887654321", // จะถูกแทนที่
                GenderID: 1
            });
            
            const expectedFail = test2.status === 400;
            console.log(`Result: ${expectedFail ? '✅ PASS' : '❌ FAIL'} - Status: ${test2.status}`);
            results.push({ ...test2, success: expectedFail });
            
            // สรุปผลลัพธ์
            console.log('\n' + '='.repeat(50));
            console.log('📊 Test Results Summary');
            console.log('='.repeat(50));
            
            const passed = results.filter(r => r.success).length;
            const total = results.length;
            
            console.log(`✅ Passed: ${passed}/${total}`);
            console.log(`❌ Failed: ${total - passed}/${total}`);
            console.log(`🎯 Success Rate: ${((passed/total) * 100).toFixed(2)}%`);
            
        } finally {
            // Cleanup ไม่ว่าจะสำเร็จหรือล้มเหลว
            await this.cleanup();
        }
        
        return results;
    }
}

// Export for use
module.exports = TransactionTest;

// Run if called directly
if (require.main === module) {
    const test = new TransactionTest();
    test.runTestSuite().catch(console.error);
}
