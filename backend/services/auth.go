package services

import (
   "errors"
   "time"

   jwt "github.com/dgrijalva/jwt-go"
)

// JwtWrapper wraps the signing key and the issuer
type JwtWrapper struct {
   SecretKey       string
   Issuer          string
   ExpirationHours int64
}

// JwtClaim adds email and role as a claim to the token
type JwtClaim struct {
   Email string
   Role  string // เพิ่ม Role เพื่อเก็บบทบาทผู้ใช้
   jwt.StandardClaims
}

// GenerateToken generates a jwt token
func (j *JwtWrapper) GenerateToken(email, role string) (signedToken string, err error) {
   // หมดอายุตามจำนวนชั่วโมงที่กำหนด
   expirationTime := time.Now().Local().Add(time.Hour * time.Duration(j.ExpirationHours))

   claims := &JwtClaim{
       Email: email,
       Role:  role, // กำหนดบทบาทในโทเค็น
       StandardClaims: jwt.StandardClaims{
           ExpiresAt: expirationTime.Unix(),
           Issuer:    j.Issuer,
       },
   }

   token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

   signedToken, err = token.SignedString([]byte(j.SecretKey))
   if err != nil {
       return
   }

   return
}

// ValidateToken validates the jwt token
func (j *JwtWrapper) ValidateToken(signedToken string) (claims *JwtClaim, err error) {
   token, err := jwt.ParseWithClaims(
       signedToken,
       &JwtClaim{},
       func(token *jwt.Token) (interface{}, error) {
           return []byte(j.SecretKey), nil
       },
   )

   if err != nil {
       return
   }

   claims, ok := token.Claims.(*JwtClaim)
   if !ok {
       err = errors.New("Couldn't parse claims")
       return
   }

   if claims.ExpiresAt < time.Now().Local().Unix() {
       err = errors.New("JWT is expired")
       return
   }

   return
}
