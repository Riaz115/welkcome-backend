# Seller Onboarding API - Uganda Based

A complete Express.js backend API for seller onboarding with KYC document management, JWT authentication, and admin verification workflow specifically designed for Uganda-based sellers.

## 🚀 Features

- ✅ **JWT Authentication** - Secure signup/login with token-based authentication
- ✅ **File Uploads** - Multer integration for ID proof and store license uploads
- ✅ **MongoDB + Mongoose** - Robust data modeling with validation
- ✅ **Role-based Access Control** - Seller and admin role management
- ✅ **Input Validation** - Comprehensive validation with error handling
- ✅ **Uganda-specific Validations** - Phone numbers, TIN format validation
- ✅ **KYC Document Management** - Upload, replace, and manage verification documents
- ✅ **Verification Workflow** - Admin approval system with status tracking
- ✅ **Clean Architecture** - Organized folder structure with separation of concerns

## 📁 Project Structure

```
backend/
├── gateway.js                      # Main Express application entry point
├── package.json                    # Dependencies and scripts
├── env.example                     # Environment variables template
├── uploads/                        # File upload storage
│   └── seller-documents/           # Seller KYC documents
└── apps/
    └── seller/
        ├── models/
        │   └── Seller.js           # Mongoose seller model
        ├── controllers/
        │   └── sellerController.js # Business logic
        ├── routes/
        │   └── sellerRoutes.js     # API route definitions
        └── middleware/
            ├── auth.js             # JWT authentication & authorization
            └── upload.js           # Multer file upload configuration
```

## ⚙️ Setup Instructions

### 1. Environment Configuration

Copy `env.example` to `.env` and configure your environment variables:

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/welkome-backend

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Verify Installation

Visit `http://localhost:5000` to see the API welcome message and available endpoints.

Health check: `http://localhost:5000/health` (if implemented in gateway.js)

## 📋 API Documentation

### Base URL
```
http://localhost:5000/api/v1/seller
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

### 🔓 Public Endpoints

#### 1. Register Seller
```http
POST /api/v1/seller/register
Content-Type: multipart/form-data
```

**Form Data Fields:**
```javascript
{
  // Basic Information
  "storeName": "ABC Electronics",
  "ownerName": "John Doe",
  "email": "john@example.com",
  "phone": "+256701234567",           // Uganda format required
  "password": "password123",

  // Business Information
  "businessRegistrationNumber": "UG123456789",
  "tinNumber": "1234567890",          // 10 digits required

  // Address (JSON string)
  "address": JSON.stringify({
    "district": "Kampala",
    "subCounty": "Central",
    "village": "Nakasero"
  }),

  // Bank Details (JSON string)
  "bankDetails": JSON.stringify({
    "bankName": "Stanbic Bank",
    "accountNumber": "1234567890123"
  }),

  // Required File Uploads
  "idProof": [FILE],                  // National ID/Passport (JPG, PNG, PDF)
  "storeLicense": [FILE]              // Store License (JPG, PNG, PDF)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Seller registered successfully",
  "data": {
    "seller": {
      "_id": "648a1b2c3d4e5f6789012345",
      "storeName": "ABC Electronics",
      "ownerName": "John Doe",
      "email": "john@example.com",
      "phone": "+256701234567",
      "verificationStatus": "pending",
      "createdAt": "2023-12-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login Seller
```http
POST /api/v1/seller/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "identifier": "john@example.com",    // Email or phone number
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "seller": {
      "_id": "648a1b2c3d4e5f6789012345",
      "storeName": "ABC Electronics",
      "verificationStatus": "pending",
      "lastLogin": "2023-12-01T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Verification Status
```http
GET /api/v1/seller/status/:id
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sellerId": "648a1b2c3d4e5f6789012345",
    "storeName": "ABC Electronics",
    "verificationStatus": "pending",
    "rejectionReason": null
  }
}
```

---

### 🔒 Protected Endpoints (Require Authentication)

#### 4. Get Seller Profile
```http
GET /api/v1/seller/profile/:id
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "648a1b2c3d4e5f6789012345",
    "storeName": "ABC Electronics",
    "ownerName": "John Doe",
    "email": "john@example.com",
    "phone": "+256701234567",
    "businessRegistrationNumber": "UG123456789",
    "tinNumber": "1234567890",
    "address": {
      "district": "Kampala",
      "subCounty": "Central",
      "village": "Nakasero"
    },
    "bankDetails": {
      "bankName": "Stanbic Bank",
      "accountNumber": "1234567890123"
    },
    "verificationStatus": "pending",
    "documents": {
      "idProof": {
        "filename": "idProof-1701423600000-123456789.jpg",
        "uploadedAt": "2023-12-01T10:00:00.000Z"
      },
      "storeLicense": {
        "filename": "storeLicense-1701423600000-987654321.pdf",
        "uploadedAt": "2023-12-01T10:00:00.000Z"
      }
    },
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  }
}
```

#### 5. Update Seller Profile
```http
PUT /api/v1/seller/profile/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (partial updates allowed):**
```json
{
  "storeName": "Updated Store Name",
  "address": {
    "district": "Wakiso",
    "subCounty": "Kira",
    "village": "Kimwanyi"
  },
  "bankDetails": {
    "bankName": "Centenary Bank",
    "accountNumber": "9876543210123"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated seller profile object
  }
}
```

#### 6. Upload/Replace Documents
```http
POST /api/v1/seller/upload-docs
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```javascript
{
  "docType": "idProof",              // "idProof" or "storeLicense"
  "document": [FILE]                 // New document file
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "idProof uploaded successfully",
  "data": {
    "document": {
      "filename": "idProof-1701423600000-123456789.jpg",
      "uploadedAt": "2023-12-01T11:00:00.000Z"
    },
    "verificationStatus": "pending"
  }
}
```

---

### 👑 Admin-Only Endpoints

#### 7. Update Verification Status
```http
PATCH /api/v1/seller/status
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sellerId": "648a1b2c3d4e5f6789012345",
  "status": "verified",              // "pending" | "verified" | "rejected"
  "rejectionReason": "Invalid ID document" // Required only for "rejected" status
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification status updated successfully",
  "data": {
    "sellerId": "648a1b2c3d4e5f6789012345",
    "verificationStatus": "verified",
    "rejectionReason": null
  }
}
```

---

## 🔍 Validation Rules

### Phone Number
- Must be in Uganda format: `+256XXXXXXXXX` or `0XXXXXXXXX`
- Example: `+256701234567` or `0701234567`

### TIN Number
- Must be exactly 10 digits
- Example: `1234567890`

### File Uploads
- **Allowed formats:** JPG, JPEG, PNG, PDF
- **Maximum file size:** 5MB per file
- **Required documents:** ID Proof and Store License

### Password
- Minimum 6 characters
- Automatically hashed using bcrypt with salt rounds of 12

---

## 🚦 Status Codes & Error Handling

### Success Responses
- `200` - OK (successful GET, PUT, PATCH requests)
- `201` - Created (successful POST requests)

### Error Responses
- `400` - Bad Request (validation errors, missing required fields)
- `401` - Unauthorized (invalid/missing token, wrong credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side errors)

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // For validation errors
}
```

---

## 🛡️ Security Features

1. **Password Hashing:** bcrypt with salt rounds of 12
2. **JWT Authentication:** Secure token-based authentication
3. **Role-based Access Control:** Seller vs Admin permissions
4. **File Upload Security:** Type and size restrictions
5. **Input Validation:** Comprehensive data validation
6. **Error Handling:** Secure error messages without sensitive data exposure

---

## 🧪 Testing the API

### Using curl

**Register a new seller:**
```bash
curl -X POST http://localhost:5000/api/v1/seller/register \
  -F "storeName=Test Store" \
  -F "ownerName=Test Owner" \
  -F "email=test@example.com" \
  -F "phone=+256701234567" \
  -F "password=password123" \
  -F "businessRegistrationNumber=UG123456789" \
  -F "tinNumber=1234567890" \
  -F 'address={"district":"Kampala","subCounty":"Central","village":"Nakasero"}' \
  -F 'bankDetails={"bankName":"Test Bank","accountNumber":"1234567890123"}' \
  -F "idProof=@/path/to/id.jpg" \
  -F "storeLicense=@/path/to/license.pdf"
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/seller/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

**Get profile (with token):**
```bash
curl -X GET http://localhost:5000/api/v1/seller/profile/SELLER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGO_URI` in your `.env` file

2. **File Upload Errors**
   - Verify file size is under 5MB
   - Check file format is JPG, PNG, or PDF
   - Ensure uploads directory has write permissions

3. **JWT Token Errors**
   - Check if `JWT_SECRET` is set in `.env`
   - Ensure token is included in Authorization header
   - Verify token hasn't expired

4. **Phone Number Validation**
   - Use Uganda format: `+256XXXXXXXXX`
   - Ensure exactly 9 digits after country code

### Debug Mode

Set `NODE_ENV=development` in your `.env` file to get detailed error stack traces.

---

## 📝 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📞 Support

For technical support or questions, please contact the development team.

---

**Note:** This API is specifically designed for Uganda-based sellers and includes Uganda-specific validations for phone numbers and business requirements. 