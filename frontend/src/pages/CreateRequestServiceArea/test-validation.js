/**
 * Test file for Corporate Registration Number validation with detailed output
 */

function validateCorporateRegistrationNumber(registrationNumber) {
  // Convert to string and remove any non-digit characters
  const cleanNumber = String(registrationNumber).replace(/\D/g, '');

  // Check if it's exactly 13 digits
  if (cleanNumber.length !== 13) {
    return { valid: false, reason: 'Not exactly 13 digits' };
  }

  // Check if all characters are digits
  if (!/^\d{13}$/.test(cleanNumber)) {
    return { valid: false, reason: 'Contains non-digit characters' };
  }

  // Get the first 12 digits
  const first12Digits = cleanNumber.substring(0, 12);
  const providedCheckDigit = parseInt(cleanNumber.charAt(12));

  // Calculate check digit using the algorithm
  // CORRECTED: The weights should be from 13 down to 2
  const weights = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  let calculationDetails = [];

  console.log(`First 12 digits: ${first12Digits}`);
  console.log(`Provided check digit: ${providedCheckDigit}`);

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12Digits.charAt(i));
    const weight = weights[i];
    const product = digit * weight;
    sum += product;

    calculationDetails.push({
      digit: digit,
      weight: weight,
      product: product
    });

    console.log(`Digit ${i + 1}: ${digit} × ${weight} = ${product}`);
  }

  console.log(`Total sum: ${sum}`);

  const remainder = sum % 11;
  console.log(`Sum ÷ 11 = ${Math.floor(sum / 11)} remainder ${remainder}`);

  let calculatedCheckDigit = 11 - remainder;
  console.log(`11 - ${remainder} = ${calculatedCheckDigit}`);

  // Apply special conditions
  if (calculatedCheckDigit === 10) {
    calculatedCheckDigit = 0;
    console.log(`Special condition: 10 → 0`);
  } else if (calculatedCheckDigit === 11) {
    calculatedCheckDigit = 1;
    console.log(`Special condition: 11 → 1`);
  }

  console.log(`Calculated check digit: ${calculatedCheckDigit}`);
  console.log(`Provided check digit: ${providedCheckDigit}`);
  console.log(`Match: ${calculatedCheckDigit === providedCheckDigit ? 'YES' : 'NO'}`);

  // Compare calculated check digit with provided check digit
  const isValid = calculatedCheckDigit === providedCheckDigit;

  return {
    valid: isValid,
    calculatedCheckDigit: calculatedCheckDigit,
    providedCheckDigit: providedCheckDigit,
    calculationDetails: calculationDetails
  };
}

// Test the specific number
const testNumber = "1329901260944";
console.log(`Testing: ${testNumber}`);
console.log("=".repeat(50));

const result = validateCorporateRegistrationNumber(testNumber);

console.log("=".repeat(50));
console.log(`Result: ${result.valid ? 'TRUE (Valid)' : 'FALSE (Invalid)'}`);

// Test additional numbers
console.log("\n" + "=".repeat(50));
console.log("Testing additional numbers:");
console.log("=".repeat(50));

const testNumbers = [
  "0105536000019",
  "0105536000011",
  "0105536000014", // Invalid
  "1234567890123", // Invalid

];

// // Test all numbers
// testNumbers.forEach(number => {
//   console.log(`\nTesting: ${number}`);
//   console.log("-".repeat(30));
//   const testResult = validateCorporateRegistrationNumber(number);
//   console.log(`Result: ${testResult.valid ? 'TRUE (Valid)' : 'FALSE (Invalid)'}`);
//   if (!testResult.valid) {
//     console.log(`Reason: ${testResult.reason || 'Invalid check digit'}`);
//   }
// });