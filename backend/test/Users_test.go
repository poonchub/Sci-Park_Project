package unit

import (
	"testing"

	"sci-park_web-application/entity"
	_ "sci-park_web-application/validator" // Import to register custom validators

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestUserValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	// ทดสอบ: ข้อมูลถูกต้อง มีครบทุกฟิลด์
	t.Run("Valid User Data with all fields", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "123456",
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ทดสอบ: ข้อมูลถูกต้อง มีแค่ฟิลด์จำเป็น
	t.Run("Valid User Data without optional fields", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ทดสอบ: EmployeeID ว่าง (คนนอก)
	t.Run("Valid User Data with empty EmployeeID", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "", // Empty EmployeeID should be valid
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ทดสอบ: อีเมลผิดรูปแบบ
	t.Run("Invalid Email Format", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "invalid-email-format",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: EmployeeID น้อยกว่า 6 หลัก
	t.Run("Invalid Employee ID - Not 6 digits (when provided)", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "12345", // Only 5 digits
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: EmployeeID มีตัวอักษร
	t.Run("Invalid Employee ID - Contains letters (when provided)", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "12345A", // Contains letter
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: เบอร์โทรไม่ขึ้นต้นด้วย 0
	t.Run("Invalid Phone Number - Doesn't start with 0", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "1812345678", // Starts with 1 instead of 0
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: เบอร์โทรสั้นเกินไป
	t.Run("Invalid Phone Number - Wrong length", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "081234567", // Only 9 digits total
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: รหัสผ่านสั้นเกินไป
	t.Run("Invalid Password - Too short", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "Short1!", // Only 7 characters
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: รหัสผ่านไม่มีตัวพิมพ์ใหญ่
	t.Run("Invalid Password - No uppercase", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "securepass123!", // No uppercase
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: รหัสผ่านไม่มีตัวพิมพ์เล็ก
	t.Run("Invalid Password - No lowercase", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SECUREPASS123!", // No lowercase
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: รหัสผ่านไม่มีตัวเลข
	t.Run("Invalid Password - No number", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass!", // No number
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: รหัสผ่านไม่มีอักขระพิเศษ
	t.Run("Invalid Password - No special character", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123", // No special character
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: รหัสผ่านใช้ @ เป็นอักขระพิเศษ
	t.Run("Valid Password with different special characters", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123@", // Using @ as special character
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ทดสอบ: ไม่มีชื่อจริง
	t.Run("Missing required FirstName", func(t *testing.T) {
		user := entity.User{
			LastName: "Doe",
			Email:    "john.doe@example.com",
			Password: "SecurePass123!",
			Phone:    "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: ไม่มีนามสกุล
	t.Run("Missing required LastName", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: ไม่มีอีเมล
	t.Run("Missing required Email", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: ไม่มีรหัสผ่าน
	t.Run("Missing required Password", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: ไม่มีเบอร์โทร
	t.Run("Missing required Phone", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ========== Additional Edge Cases ==========

	// ทดสอบ: อีเมลไม่มี @
	t.Run("Invalid Email - Missing @ symbol", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "johndoeexample.com", // Missing @
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: อีเมลไม่มี domain
	t.Run("Invalid Email - Missing domain", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@", // Missing domain
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: อีเมลไม่มีชื่อหน้า @
	t.Run("Invalid Email - Missing local part", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "@example.com", // Missing local part
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: เบอร์โทรยาวเกินไป
	t.Run("Invalid Phone Number - Too long", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "08123456789", // 11 digits
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: เบอร์โทรมีขีดกลาง
	t.Run("Invalid Phone Number - Contains non-digits", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "081-234-5678", // Contains dashes
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: เบอร์โทรมีช่องว่าง
	t.Run("Invalid Phone Number - Contains spaces", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "081 234 5678", // Contains spaces
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: EmployeeID ยาวเกินไป
	t.Run("Invalid Employee ID - Too long", func(t *testing.T) {
		user := entity.User{
			EmployeeID: "1234567", // 7 digits instead of 6
			FirstName:  "John",
			LastName:   "Doe",
			Email:      "john.doe@example.com",
			Password:   "SecurePass123!",
			Phone:      "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: EmployeeID มีอักขระพิเศษ
	t.Run("Invalid Employee ID - Contains special characters", func(t *testing.T) {
		user := entity.User{
			EmployeeID: "12345!", // Contains exclamation mark
			FirstName:  "John",
			LastName:   "Doe",
			Email:      "john.doe@example.com",
			Password:   "SecurePass123!",
			Phone:      "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: EmployeeID ผสมตัวอักษรและเลข
	t.Run("Invalid Employee ID - Mixed alphanumeric", func(t *testing.T) {
		user := entity.User{
			EmployeeID: "123ABC", // Mixed letters and numbers
			FirstName:  "John",
			LastName:   "Doe",
			Email:      "john.doe@example.com",
			Password:   "SecurePass123!",
			Phone:      "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	// ทดสอบ: เบอร์โทรขึ้นต้น 08
	t.Run("Valid Phone Number - Starting with 08", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "0887654321", // Valid 08x number
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ทดสอบ: เบอร์โทรขึ้นต้น 09
	t.Run("Valid Phone Number - Starting with 09", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "0912345678", // Valid 09x number
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ทดสอบ: รหัสผ่านใช้ # เป็นอักขระพิเศษ
	t.Run("Valid Password - Various special characters", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123#", // Using # as special character
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
