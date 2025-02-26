package config

import (
	"log"
   "golang.org/x/crypto/bcrypt"
	"os"
	"github.com/joho/godotenv"
)

// hashPassword เป็น function สำหรับการแปลง password
func HashPassword(password string) (string, error) {
   bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
   return string(bytes), err
}


// checkPasswordHash เป็น function สำหรับ check password ที่ hash แล้ว ว่าตรงกันหรือไม่
func CheckPasswordHash(password, hash []byte) bool {
   err := bcrypt.CompareHashAndPassword(hash, password)
   return err == nil
}

// GetSecretKey คืนค่า SecretKey ที่ใช้ในการเข้ารหัส JWT
func GetSecretKey() string {
	secret := os.Getenv("JWT_SECRET_KEY") // ดึงค่าจาก Environment Variable
	if secret == "" {
		secret = "default-secret-key" // ค่าพื้นฐาน ถ้าไม่ได้ตั้งค่า ENV
	}
	return secret
}



// LoadEnv โหลดค่าใน .env ไฟล์
func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found, using default values")
	}
}
