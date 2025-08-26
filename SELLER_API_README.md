# Seller Onboarding API - Uganda Based

A complete Express.js backend API for seller onboarding with KYC document management, JWT authentication, and admin verification workflow.

## Features

- ✅ JWT Authentication (signup/login)
- ✅ File uploads with Multer (ID proof, store license)
- ✅ MongoDB with Mongoose ODM
- ✅ Role-based access control (seller/admin)
- ✅ Input validation and error handling
- ✅ Uganda-specific validations (phone numbers, TIN format)
- ✅ KYC document management
- ✅ Verification status workflow

## Setup Instructions

### 1. Environment Variables

Copy `env.example` to `.env` and configure:

```bash
MONGO_URI=mongodb://localhost:27017/welkome-backend
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

#### Register Seller
```http
POST /api/sellers/register
Content-Type: multipart/form-data
```

**Form Data:**
```javascript
{
  "storeName": "ABC Electronics",
  "ownerName": "John Doe",
  "email": "john@example.com",
  "phone": "+256701234567", // Uganda format
  "password": "password123",
  "businessRegistrationNumber": "UG123456789",
  "tinNumber": "1234567890", // 10 digits
  "address": "{\"district\":\"Kampala\",\"subCounty\":\"Central\",\"village\":\"Nakasero\"}",
  "bankDetails": "{\"bankName\":\"Stanbic Bank\",\"accountNumber\":\"1234567890123\"}",
  "idProof": [FILE], // Image/PDF file
  "storeLicense": [FILE] // Image/PDF file
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller registered successfully",
  "data": {
    "seller": {
      "_id": "...",
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

#### Login
```http
POST /api/sellers/login
Content-Type: application/json
```

**Body:**
```json
{
  "identifier": "john@example.com", // Email or phone
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "seller": {
      "_id": "...",
      "storeName": "ABC Electronics",
      "verificationStatus": "pending",
      "lastLogin": "2023-12-01T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Profile Management

#### Get Seller Profile
```http
GET /api/sellers/profile/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
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
    }
  }
}
```

#### Update Profile
```http
PUT /api/sellers/profile/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "storeName": "Updated Store Name",
  "address": {
    "district": "Wakiso",
    "subCounty": "Kira",
    "village": "Kimwanyi"
  }
}
```

### Document Management

#### Upload Documents
```http
POST /api/sellers/upload-docs
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```javascript
{
  "docType": "idProof", // or "storeLicense"
  "document": [FILE] // New document file
}
```

**Response:**
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

### Verification Status

#### Get Verification Status
```http
GET /api/sellers/status/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sellerId": "...",
    "storeName": "ABC Electronics",
    "verificationStatus": "pending", // pending|verified|rejected
    "rejectionReason": null
  }
}
```

#### Update Verification Status (Admin Only)
```http
PATCH /api/sellers/status
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**
```json
{
  "sellerId": "seller-id-here",
  "status": "verified", // pending|verified|rejected
  "rejectionReason": "Invalid documents" // Required if status is "rejected"
}
```

## File Upload Specifications

### Accepted File Types
- **Images:** JPEG, JPG, PNG
- **Documents:** PDF

### File Size Limits
- **Maximum file size:** 5MB per file
- **Maximum files per registration:** 2 files (ID proof + store license)

### Upload Directory Structure
```
backend/
├── uploads/
│   └── seller-documents/
│       ├── idProof-1701423600000-123456789.jpg
│       └── storeLicense-1701423600000-987654321.pdf
```

## Authentication

### JWT Token Structure
- **Header:** `Authorization: Bearer <token>`
- **Expiration:** 7 days (configurable)
- **Payload:** Contains seller ID and role

### Protected Routes
- All routes under `/api/sellers/` except:
  - `POST /register`
  - `POST /login`
  - `GET /status/:id`

### Role-Based Access
- **Seller:** Can access own profile and upload documents
- **Admin:** Can update verification status and access all profiles

## Validation Rules

### Uganda-Specific Validations
- **Phone Number:** Must match format `+256xxxxxxxxx` or `0xxxxxxxxx`
- **TIN Number:** Must be exactly 10 digits
- **Business Registration:** Required and unique

### Required Fields for Registration
- Store name, owner name, email, phone, password
- Business registration number, TIN number
- Complete address (district, sub-county, village)
- Bank details (bank name, account number)
- Both ID proof and store license documents

## Error Handling

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Email is required",
    "Phone number format is invalid"
  ]
}
```

#### Authentication Error
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### File Upload Error
```json
{
  "success": false,
  "message": "File size too large. Maximum size is 5MB per file."
}
```

## Database Schema

### Seller Model
```javascript
{
  storeName: String (required, max: 100),
  ownerName: String (required, max: 100),
  email: String (required, unique, lowercase),
  phone: String (required, unique, Uganda format),
  password: String (required, hashed, min: 6),
  businessRegistrationNumber: String (required, unique, uppercase),
  tinNumber: String (required, unique, 10 digits),
  address: {
    district: String (required),
    subCounty: String (required),
    village: String (required)
  },
  bankDetails: {
    bankName: String (required),
    accountNumber: String (required, 10-20 digits)
  },
  documents: {
    idProof: {
      filename: String,
      path: String,
      uploadedAt: Date
    },
    storeLicense: {
      filename: String,
      path: String,
      uploadedAt: Date
    }
  },
  verificationStatus: String (enum: pending|verified|rejected, default: pending),
  rejectionReason: String,
  role: String (enum: seller|admin, default: seller),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token-based authentication
- File type validation
- File size limits
- Input sanitization
- Role-based access control
- Unique constraint validations

## Testing

### Manual Testing with Postman/cURL

1. **Register a seller** with required form data and files
2. **Login** with email/phone and password
3. **Access profile** with JWT token
4. **Upload documents** with proper authentication
5. **Update verification status** with admin token

### Sample cURL Commands

```bash
# Register seller
curl -X POST http://localhost:5000/api/sellers/register \
  -F "storeName=Test Store" \
  -F "ownerName=John Doe" \
  -F "email=john@test.com" \
  -F "phone=+256701234567" \
  -F "password=password123" \
  -F "businessRegistrationNumber=UG123456789" \
  -F "tinNumber=1234567890" \
  -F "address={\"district\":\"Kampala\",\"subCounty\":\"Central\",\"village\":\"Nakasero\"}" \
  -F "bankDetails={\"bankName\":\"Stanbic Bank\",\"accountNumber\":\"1234567890123\"}" \
  -F "idProof=@/path/to/id.jpg" \
  -F "storeLicense=@/path/to/license.pdf"

# Login
curl -X POST http://localhost:5000/api/sellers/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"john@test.com","password":"password123"}'
```

## Production Considerations

1. **Environment Variables:** Use secure JWT secrets in production
2. **File Storage:** Consider cloud storage (AWS S3, Cloudinary) for scalability
3. **Database:** Use MongoDB Atlas or dedicated MongoDB server
4. **SSL/HTTPS:** Enable HTTPS in production
5. **Rate Limiting:** Implement rate limiting for API endpoints
6. **Logging:** Add comprehensive logging for debugging
7. **Monitoring:** Set up health checks and monitoring
8. **Backup:** Regular database backups
9. **File Cleanup:** Implement cleanup for unused files

## License

This project is part of the Welkome backend system. 