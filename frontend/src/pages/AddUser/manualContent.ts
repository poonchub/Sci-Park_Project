export const addUserManualContent = `===========================================
ADD USER MANUAL
===========================================

This manual explains how to add users manually using the Add User form.

===========================================
ACCESSING THE ADD USER PAGE
===========================================

1. Navigate to the Add User page from the main menu
2. The page will load with the form ready for data entry
3. All required fields will show validation errors immediately

===========================================
USER TYPE SELECTION
===========================================

The form supports two types of users:

INTERNAL USER (Employee):
- Has an Employee ID
- Can have any role: User, Operator, Manager, Admin
- Can have privileges/packages
- Company name and business detail are optional

EXTERNAL USER (Non-Employee):
- No Employee ID
- Can only have role: User
- Can have privileges/packages
- Company name and business detail are REQUIRED

===========================================
FORM FIELDS AND REQUIREMENTS
===========================================

REQUIRED FIELDS (All User Types):

1. User Type
   - Description: Select whether user is Internal or External
   - Options: Internal User, External User
   - Validation: Must select one option

2. First Name
   - Description: User's first name (without title)
   - Format: Text only
   - Example: John, Mary, สมชาย
   - Validation: Cannot be empty

3. Last Name
   - Description: User's last name
   - Format: Text only
   - Example: Smith, Johnson, ใจดี
   - Validation: Cannot be empty

4. Gender
   - Description: User's gender
   - Options: Male, Female
   - Validation: Must select one option

5. Phone Number
   - Description: User's phone number
   - Format: Thai mobile number starting with 0
   - Example: 0812345678, 0898765432
   - Validation: Must start with 0 and have exactly 10 digits

6. Email
   - Description: User's email address
   - Format: Valid email format
   - Example: john.smith@company.com, user@domain.co.th
   - Validation: Must be valid email format

7. Password
   - Description: User's login password
   - Format: Complex password requirements
   - Requirements: 
     * At least 8 characters
     * At least 1 lowercase letter
     * At least 1 uppercase letter
     * At least 1 number
     * At least 1 special character
   - Example: MyPass123!
   - Validation: Must meet all complexity requirements

INTERNAL USER ADDITIONAL FIELDS:

8. Employee ID
   - Description: Employee identification number
   - Format: 6-digit number
   - Example: 123456, 789012
   - Validation: Must be exactly 6 digits
   - Note: Only required for Internal Users

9. Position (Role)
   - Description: User's role in the system
   - Options: User, Operator, Manager, Admin
   - Validation: Must select one option
   - Note: Only required for Internal Users

10. Management (Request Type)
    - Description: Type of management access (Manager only)
    - Options: Internal, External, Both
    - Validation: Required only when Position is Manager
    - Note: Only appears when Manager role is selected

EXTERNAL USER ADDITIONAL FIELDS:

11. Company Name
    - Description: Company name (for external users)
    - Format: Text
    - Example: ABC Corporation, XYZ Company
    - Validation: Required for External Users

12. Business Description
    - Description: Business description (for external users)
    - Format: Text
    - Example: Software Development, Consulting Services
    - Validation: Required for External Users

OPTIONAL FIELDS (All User Types):

13. Profile Photo
    - Description: User's profile picture
    - Format: Image file (JPG, PNG, etc.)
    - Validation: Optional, must be valid image file
    - Note: Only one file can be selected

14. Privileges (Package)
    - Description: User's subscription package
    - Options: None, Silver, Gold, Platinum, Diamond
    - Validation: Optional
    - Note: Can be left as "No privileges"

===========================================
FORM VALIDATION RULES
===========================================

1. Email Format: Must be valid email (user@domain.com)
2. Phone Format: Must start with 0 and have 10 digits
3. Employee ID: Must be exactly 6 digits (Internal Users only)
4. Password: Must meet complexity requirements
5. Company Name: Required for External Users
6. Business Description: Required for External Users
7. Position: Required for Internal Users
8. Management: Required when Position is Manager

===========================================
STEP-BY-STEP INSTRUCTIONS
===========================================

STEP 1: Select User Type
1. Choose "Internal User" or "External User"
2. Form will automatically show/hide relevant fields

STEP 2: Add Profile Photo (Optional)
1. Click "Add Photo" button
2. Select an image file
3. Photo will appear in the avatar preview

STEP 3: Fill Personal Information
1. Enter First Name (required)
2. Enter Last Name (required)
3. Select Gender from dropdown (required)
4. Enter Phone Number (required, 10 digits starting with 0)
5. Enter Email (required, valid format)
6. Enter Password (required, complex)

STEP 4: Fill Role-Specific Information

For Internal Users:
1. Enter Employee ID (6 digits)
2. Select Position from dropdown
3. If Manager role selected, select Management type
4. Select Privileges (optional)

For External Users:
1. Enter Company Name
2. Enter Business Description
3. Select Privileges (optional)

STEP 5: Submit Form
1. Review all entered information
2. Click "Add User" to create the user
3. Or click "Reset" to clear all fields

===========================================
COMMON ERRORS TO AVOID
===========================================

❌ WRONG:
- Phone: 812345678 (missing leading 0)
- Phone: 081234567 (only 9 digits)
- Email: john.smith (missing @domain.com)
- Employee ID: 12345 (only 5 digits)
- Password: password (too simple)
- External user without company name
- Manager without management type

✅ CORRECT:
- Phone: 0812345678
- Email: john.smith@company.com
- Employee ID: 123456
- Password: MyPass123!
- Company name for external users
- Management type for managers

===========================================
FORM FEATURES
===========================================

1. Real-time Validation
   - Errors appear immediately when page loads
   - Validation updates as you type
   - Clear error messages for each field

2. Dynamic Form Fields
   - Fields show/hide based on user type
   - Management field appears only for Manager role
   - Employee ID required only for Internal Users

3. Password Visibility Toggle
   - Click eye icon to show/hide password
   - Helps verify password entry

4. Profile Photo Upload
   - Supports common image formats
   - Preview shows selected image
   - Only one file allowed

5. Reset Functionality
   - Reset button clears all fields
   - Removes profile photo
   - Returns to initial state

===========================================
TROUBLESHOOTING
===========================================

If form submission fails:

1. Check that all required fields are filled
2. Verify email format is correct
3. Ensure phone number starts with 0 and has 10 digits
4. Confirm Employee ID is exactly 6 digits (Internal Users)
5. Check that password meets complexity requirements
6. For External Users, ensure Company Name and Business Description are filled
7. For Managers, ensure Management type is selected

===========================================
SUCCESS INDICATORS
===========================================

When user is successfully created:
1. Success alert will appear
2. Form will automatically reset
3. Profile photo will be cleared
4. All fields will return to initial state
5. You can immediately add another user

===========================================
SUPPORT
===========================================

If you encounter issues:
1. Check the validation errors shown on the form
2. Ensure all required fields are completed
3. Verify data formats match requirements
4. Try refreshing the page if form becomes unresponsive
5. Contact system administrator for technical support

===========================================`;
