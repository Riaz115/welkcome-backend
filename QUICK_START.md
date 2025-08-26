# 🚀 Quick Start Guide - Seller Onboarding API

Get your Seller Onboarding API up and running in 5 minutes!

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

## 1. Environment Setup

Create a `.env` file in the backend directory:

```bash
# Copy from example
cp env.example .env
```

Update the `.env` file with your settings:

```env
# Required Settings
MONGO_URI=mongodb://localhost:27017/welkome-backend
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-make-it-very-long-and-complex
NODE_ENV=development

# Optional Settings
FRONTEND_URL=http://localhost:3000
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Start the API

```bash
# Development (with auto-reload)
npm run dev

# Production
npm run start
```

## 4. Verify Installation

### Check Server Status
```bash
curl http://localhost:5000
```

Expected response:
```json
{
  "message": "Server is working!"
}
```

## 5. Test API Endpoints

### Register a Seller
```bash
curl -X POST http://localhost:5000/api/v1/seller/register \
  -F "storeName=Test Store" \
  -F "ownerName=John Doe" \
  -F "email=john@example.com" \
  -F "phone=+256701234567" \
  -F "password=password123" \
  -F "businessRegistrationNumber=UG123456789" \
  -F "tinNumber=1234567890" \
  -F 'address={"district":"Kampala","subCounty":"Central","village":"Nakasero"}' \
  -F 'bankDetails={"bankName":"Test Bank","accountNumber":"1234567890123"}' \
  -F "idProof=@path/to/id.jpg" \
  -F "storeLicense=@path/to/license.pdf"
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/seller/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"john@example.com","password":"password123"}'
```

## 6. Available Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/seller/register` | Register new seller | No |
| POST | `/api/v1/seller/login` | Login seller | No |
| GET | `/api/v1/seller/profile/:id` | Get seller profile | Yes |
| PUT | `/api/v1/seller/profile/:id` | Update seller profile | Yes |
| POST | `/api/v1/seller/upload-docs` | Upload/replace documents | Yes |
| PATCH | `/api/v1/seller/status` | Update verification status (Admin) | Yes |
| GET | `/api/v1/seller/status/:id` | Get verification status | No |

## 7. Project Structure

```
backend/
├── gateway.js                # Main application entry point
├── package.json              # Dependencies and scripts
├── uploads/                  # File uploads storage
│   └── seller-documents/     # Seller KYC documents
└── apps/seller/              # Seller module
    ├── models/Seller.js      # Database model
    ├── controllers/          # Business logic
    ├── routes/               # API routes
    └── middleware/           # Authentication & uploads
```

## 8. Common Issues & Solutions

### Database Connection Error
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Compass/Atlas for cloud database
```

### File Upload Issues
- Ensure `uploads/seller-documents/` directory exists
- Check file permissions
- Verify file size < 5MB and format is JPG/PNG/PDF

### JWT Token Errors
- Make sure `JWT_SECRET` is set in `.env`
- Check token format: `Authorization: Bearer <token>`

## 9. Next Steps

1. **Read the Full Documentation**: `README_SELLER_API.md`
2. **Check API Endpoints**: Visit `http://localhost:5000` for server status
3. **Frontend Integration**: Use provided API documentation

## 10. Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-production-secret-64-chars-minimum
PORT=8080
FRONTEND_URL=https://your-domain.com
```

### Security Checklist
- ✅ Use strong JWT secret (64+ characters)
- ✅ Enable MongoDB authentication
- ✅ Use HTTPS in production
- ✅ Set up proper CORS origins
- ✅ Configure file upload limits
- ✅ Set up monitoring and logging

## 🎉 You're Ready!

Your Seller Onboarding API is now running through the gateway.js entry point. The seller routes are available at `/api/v1/seller/*`.

For detailed API documentation, see `README_SELLER_API.md`.

## 🆘 Need Help?

1. Check the logs in your terminal
2. Verify all environment variables are set
3. Ensure MongoDB is accessible
4. Check file permissions for uploads directory

Happy coding! 🚀 