import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./apps/auth/routes/authRoute.js";
import userRoutes from "./apps/user/routes/userRoutes.js";
import productRoutes from "./apps/Product/routes/productRoutes.js";
import sellerRoutes from "./apps/seller/routes/sellerRoutes.js";
import riderRoutes from "./apps/rider/routes/riderRoutes.js";
import categoryRoutes from "./apps/categoryManagement/routes/categoryRoutes.js";
import brandRoutes from "./apps/brand/routes/brandRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

// const corsOptions = {
//   origin: [
//     "http://localhost:3000",
//     "http://monkmaze-s3.s3-website.ap-south-1.amazonaws.com",
//     "http://ec2-13-245-5-146.af-south-1.compute.amazonaws.com:3000",
//     "http://welkome.ca",
//     "http://www.welkome.ca",
//   ],
//   methods: "GET,POST,PUT,DELETE,PATCH",
//   credentials: true,
// };
// app.use(cors(corsOptions));

// Static file serving for uploaded images



const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://monkmaze-s3.s3-website.ap-south-1.amazonaws.com",
      "https://monkmaze-s3.s3-website.ap-south-1.amazonaws.com", // HTTPS add karo
      "http://ec2-13-245-5-146.af-south-1.compute.amazonaws.com:3000",
      "http://welkome.ca",
      "https://welkome.ca", // HTTPS add karo
      "http://www.welkome.ca",
      "https://www.welkome.ca" // HTTPS add karo
    ];
    
    console.log('Request origin:', origin);
    
    if (allowedOrigins.includes(origin)) {
      console.log('Allowed by CORS:', origin);
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS", // OPTIONS add karo
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Headers specify karo
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));




app.use('/uploads', express.static('uploads'));

// DB Connection
const connectDb = async () => {
  try {
    console.log(process.env.MONGO_URI,"here is")
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database Connected Successfully!");

    // app.listen(process.env.PORT, () => {
    //   console.log(`Listening on port ${process.env.PORT}`);
    // });
    app.listen(4000, '0.0.0.0', () => {
      console.log("Listening on port 4000");
    });

  } catch (error) {
    console.error("Error Connecting To Database:", error.message);
    process.exit(1);
  }
};

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1/rider", riderRoutes);
  app.use("/api/v1/categories", categoryRoutes);
  app.use("/api/v1/brands", brandRoutes);

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.get("/", (req, res) => {
  res.send("Server is working!");
});

connectDb();

//new commit---change
