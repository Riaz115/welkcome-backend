# Rider Onboarding API - Uganda Based

A complete Express.js backend API for rider onboarding with document management, JWT authentication, and admin verification workflow specifically designed for Uganda-based riders (boda-boda, taxi, etc.).

## 🚀 Features

- ✅ **JWT Authentication** - Secure signup/login with token-based authentication
- ✅ **File Uploads** - Multer integration for ID proof and driver license uploads
- ✅ **MongoDB + Mongoose** - Robust data modeling with validation
- ✅ **Role-based Access Control** - Rider and admin role management
- ✅ **Input Validation** - Comprehensive validation with error handling
- ✅ **Uganda-specific Validations** - Phone numbers, license format validation
- ✅ **Document Management** - Upload, replace, and manage verification documents
- ✅ **Verification Workflow** - Admin approval system with status tracking
- ✅ **Availability Management** - Rider availability status for verified riders
- ✅ **Vehicle Type Support** - Support for multiple vehicle types (boda-boda, taxi, etc.)

## 📁 Project Structure

```
backend/
├── gateway.js                      # Main Express application entry point
├── package.json                    # Dependencies and scripts
├── env.example                     # Environment variables template
├── uploads/                        # File upload storage
│   └── rider-documents/           # Rider documents (ID, licenses)
└── apps/
    └── rider/
        ├── models/
        │   └── Rider.js           # Mongoose rider model
        ├── controllers/
        │   └── riderController.js # Business logic
        ├── routes/
        │   └── riderRoutes.js     # API route definitions
        └── middleware/
            ├── auth.js             # JWT authentication & authorization
            └── upload.js           # Multer file upload configuration
```

## ⚙️ Setup Instructions

### 1. Environment Configuration

Ensure your `.env` file includes:

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

### 2. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run start
```

### 3. Verify Installation

Visit `http://localhost:5000` to see the server status.

## 📋 API Documentation

### Base URL
```
http://localhost:5000/api/v1/rider
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

### 🔓 Public Endpoints

#### 1. Register Rider
```http
POST /api/v1/rider/register
Content-Type: multipart/form-data
```

**Form Data Fields:**
```javascript
{
  // Basic Information
  "fullName": "John Doe",
  "phone": "+256701234567",           // Uganda format required
  "email": "john@example.com",
  "password": "password123",

  // Vehicle & License Information
  "vehicleType": "boda-boda",         // boda-boda, taxi, pickup, motorcycle, car
  "licenseNumber": "DL123456789",     // 6-15 alphanumeric characters

  // Address (JSON string)
  "address": JSON.stringify({
    "district": "Kampala",
    "subCounty": "Central",
    "village": "Nakasero"
  }),

  // Optional Fields
  "experienceYears": "5",             // Number of years of driving experience
  "emergencyContact": JSON.stringify({
    "name": "Jane Doe",
    "phone": "+256701234568",
    "relationship": "Sister"
  }),

  // Required File Uploads
  "idProof": [FILE],                  // National ID/Passport (JPG, PNG, PDF)
  "driverLicense": [FILE]             // Driver License/Permit (JPG, PNG, PDF)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Rider registered successfully",
  "data": {
    "rider": {
      "_id": "648a1b2c3d4e5f6789012345",
      "fullName": "John Doe",
      "phone": "+256701234567",
      "email": "john@example.com",
      "vehicleType": "boda-boda",
      "licenseNumber": "DL123456789",
      "verificationStatus": "pending",
      "isAvailable": false,
      "createdAt": "2023-12-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login Rider
```http
POST /api/v1/rider/login
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
    "rider": {
      "_id": "648a1b2c3d4e5f6789012345",
      "fullName": "John Doe",
      "vehicleType": "boda-boda",
      "verificationStatus": "pending",
      "isAvailable": false,
      "lastLogin": "2023-12-01T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Verification Status
```http
GET /api/v1/rider/status/:id
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "riderId": "648a1b2c3d4e5f6789012345",
    "fullName": "John Doe",
    "vehicleType": "boda-boda",
    "verificationStatus": "pending",
    "rejectionReason": null,
    "isAvailable": false
  }
}
```

---

### 🔒 Protected Endpoints (Require Authentication)

#### 4. Get Rider Profile
```http
GET /api/v1/rider/profile/:id
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "648a1b2c3d4e5f6789012345",
    "fullName": "John Doe",
    "phone": "+256701234567",
    "email": "john@example.com",
    "vehicleType": "boda-boda",
    "licenseNumber": "DL123456789",
    "address": {
      "district": "Kampala",
      "subCounty": "Central",
      "village": "Nakasero"
    },
    "experienceYears": 5,
    "emergencyContact": {
      "name": "Jane Doe",
      "phone": "+256701234568",
      "relationship": "Sister"
    },
    "verificationStatus": "pending",
    "isActive": true,
    "isAvailable": false,
    "documents": {
      "idProof": {
        "filename": "idProof-1701423600000-123456789.jpg",
        "uploadedAt": "2023-12-01T10:00:00.000Z"
      },
      "driverLicense": {
        "filename": "driverLicense-1701423600000-987654321.pdf",
        "uploadedAt": "2023-12-01T10:00:00.000Z"
      }
    },
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  }
}
```

#### 5. Update Rider Profile
```http
PUT /api/v1/rider/profile/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (partial updates allowed):**
```json
{
  "fullName": "John Updated Name",
  "address": {
    "district": "Wakiso",
    "subCounty": "Kira",
    "village": "Kimwanyi"
  },
  "experienceYears": 6,
  "emergencyContact": {
    "name": "Jane Updated",
    "phone": "+256701234569",
    "relationship": "Sister"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated rider profile object
  }
}
```

#### 6. Upload/Replace Documents
```http
POST /api/v1/rider/upload-docs
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```javascript
{
  "docType": "idProof",              // "idProof" or "driverLicense"
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

#### 7. Update Availability Status
```http
PATCH /api/v1/rider/availability/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isAvailable": true                // true for available, false for unavailable
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Availability updated to available",
  "data": {
    "riderId": "648a1b2c3d4e5f6789012345",
    "isAvailable": true,
    "verificationStatus": "verified"
  }
}
```

---

### 👑 Admin-Only Endpoints

#### 8. Update Verification Status
```http
PATCH /api/v1/rider/status
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "riderId": "648a1b2c3d4e5f6789012345",
  "status": "verified",              // "pending" | "verified" | "rejected"
  "rejectionReason": "Invalid license document" // Required only for "rejected" status
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification status updated successfully",
  "data": {
    "riderId": "648a1b2c3d4e5f6789012345",
    "verificationStatus": "verified",
    "rejectionReason": null,
    "isAvailable": false
  }
}
```

---

## 🔍 Validation Rules

### Phone Number
- Must be in Uganda format: `+256XXXXXXXXX` or `0XXXXXXXXX`
- Example: `+256701234567` or `0701234567`

### License Number
- Must be 6-15 alphanumeric characters
- Automatically converted to uppercase
- Example: `DL123456789`

### Vehicle Types
- Allowed values: `boda-boda`, `taxi`, `pickup`, `motorcycle`, `car`
- Automatically converted to lowercase

### File Uploads
- **Allowed formats:** JPG, JPEG, PNG, PDF
- **Maximum file size:** 5MB per file
- **Required documents:** ID Proof and Driver License

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
- `403` - Forbidden (insufficient permissions, verification required)
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

## 🔄 Rider Verification Workflow

1. **Registration** → Status: `pending`, Available: `false`
2. **Admin Review** → Status: `verified`/`rejected`, Available: `false`
3. **Verified Riders** → Can set Available: `true`/`false`

### Availability Rules
- Only `verified` riders can change their availability status
- `pending` and `rejected` riders are always unavailable
- Verified riders default to unavailable and must manually set availability

---

## 🛡️ Security Features

1. **Password Hashing:** bcrypt with salt rounds of 12
2. **JWT Authentication:** Secure token-based authentication
3. **Role-based Access Control:** Rider vs Admin permissions
4. **Resource Access Control:** Riders can only access their own data
5. **File Upload Security:** Type and size restrictions
6. **Input Validation:** Comprehensive data validation
7. **Document Management:** Secure file handling and cleanup

---

## 🧪 Testing the API

### Using curl

**Register a new rider:**
```bash
curl -X POST http://localhost:5000/api/v1/rider/register \
  -F "fullName=John Doe" \
  -F "phone=+256701234567" \
  -F "email=john@example.com" \
  -F "password=password123" \
  -F "vehicleType=boda-boda" \
  -F "licenseNumber=DL123456789" \
  -F 'address={"district":"Kampala","subCounty":"Central","village":"Nakasero"}' \
  -F "experienceYears=5" \
  -F 'emergencyContact={"name":"Jane Doe","phone":"+256701234568","relationship":"Sister"}' \
  -F "idProof=@/path/to/id.jpg" \
  -F "driverLicense=@/path/to/license.pdf"
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/rider/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "password123"
  }'
```

**Get profile (with token):**
```bash
curl -X GET http://localhost:5000/api/v1/rider/profile/RIDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update availability (verified riders only):**
```bash
curl -X PATCH http://localhost:5000/api/v1/rider/availability/RIDER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAvailable": true}'
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
   - Ensure uploads/rider-documents directory has write permissions

3. **JWT Token Errors**
   - Check if `JWT_SECRET` is set in `.env`
   - Ensure token is included in Authorization header
   - Verify token hasn't expired

4. **Phone Number Validation**
   - Use Uganda format: `+256XXXXXXXXX`
   - Ensure exactly 9 digits after country code

5. **Availability Updates**
   - Only verified riders can update availability
   - Check verification status before attempting availability changes

### Debug Mode

Set `NODE_ENV=development` in your `.env` file to get detailed error stack traces.

---

## 📈 Additional Features

### Vehicle Type Support
The API supports multiple vehicle types common in Uganda:
- **boda-boda** - Motorcycle taxi
- **taxi** - Regular taxi service
- **pickup** - Pickup truck for cargo
- **motorcycle** - General motorcycle
- **car** - Private car service

### Emergency Contact
Riders can provide emergency contact information for safety purposes:
- Contact name
- Phone number (Uganda format)
- Relationship to rider

### Experience Tracking
Track rider experience years for better service matching and insurance purposes.

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

**Note:** This API is specifically designed for Uganda-based riders and includes Uganda-specific validations for phone numbers and vehicle types commonly used in Uganda's transport sector. 