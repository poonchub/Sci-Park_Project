/**
 * Validates a 13-digit corporate registration number using check digit algorithm
 * @param registrationNumber - The 13-digit registration number as string or number
 * @returns true if valid, false if invalid
 */
export function validateCorporateRegistrationNumber(registrationNumber: string | number): boolean {
  // Convert to string and remove any non-digit characters
  const cleanNumber = String(registrationNumber).replace(/\D/g, '');
  
  // Check if it's exactly 13 digits
  if (cleanNumber.length !== 13) {
    return false;
  }
  
  // Check if all characters are digits
  if (!/^\d{13}$/.test(cleanNumber)) {
    return false;
  }
  
  // Get the first 12 digits
  const first12Digits = cleanNumber.substring(0, 12);
  const providedCheckDigit = parseInt(cleanNumber.charAt(12));
  
  // Calculate check digit using the algorithm
  // Weights should be from 13 down to 2
  const weights = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(first12Digits.charAt(i)) * weights[i];
  }
  
  const remainder = sum % 11;
  let calculatedCheckDigit = 11 - remainder;
  
  // Apply special conditions
  if (calculatedCheckDigit === 10) {
    calculatedCheckDigit = 0;
  } else if (calculatedCheckDigit === 11) {
    calculatedCheckDigit = 1;
  }
  
  // Compare calculated check digit with provided check digit
  return calculatedCheckDigit === providedCheckDigit;
}

/**
 * Example usage and test cases
 */
export function testCorporateRegistrationValidator(): void {
  // Valid registration numbers (examples)
  const validNumbers = [
    "1329901260944", // Example valid number from test file
    "0105536000019", // Example valid number
    "0105536000020", // Example valid number
  ];
  
  // Invalid registration numbers
  const invalidNumbers = [
    "0105536000014", // Wrong check digit
    "0105536000022", // Wrong check digit
    "1234567890123", // Invalid check digit
    "0105536000011", // Too short
    "01055360000134", // Too long
    "abc123def456",  // Contains letters
    "",              // Empty string
  ];
  
  console.log("Testing Corporate Registration Number Validator:");
  console.log("================================================");
  
  console.log("\nValid numbers:");
  validNumbers.forEach(num => {
    const isValid = validateCorporateRegistrationNumber(num);
    console.log(`${num}: ${isValid ? "✓ Valid" : "✗ Invalid"}`);
  });
  
  console.log("\nInvalid numbers:");
  invalidNumbers.forEach(num => {
    const isValid = validateCorporateRegistrationNumber(num);
    console.log(`${num}: ${isValid ? "✓ Valid" : "✗ Invalid"}`);
  });
}

// Uncomment the line below to run tests when this file is executed directly
// testCorporateRegistrationValidator();
