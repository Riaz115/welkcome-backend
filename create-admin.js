import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./apps/user/models/userModel.js";
import { hashPassword } from "./apps/auth/services/bcrypt.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database");

    // Admin users to create
    const admins = [
      {
        email: "riaz90603@gmail.com",
        password: "aszx1234",
        firstName: "Riaz",
        lastName: "Admin"
      },
      {
        email: "monkmaze@gmail.com", 
        password: "monkmaze123",
        firstName: "MonkMaze",
        lastName: "Admin"
      }
    ];

    for (const adminData of admins) {
      console.log(`\n🔍 Checking admin: ${adminData.email}`);
      
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email, role: "admin" });
      
      if (existingAdmin) {
        console.log(`✅ Admin user already exists with email: ${adminData.email}`);
        console.log("🔄 Updating password...");
        
        // Update password
        const hashedPassword = await hashPassword(adminData.password);
        existingAdmin.password = hashedPassword;
        existingAdmin.firstName = adminData.firstName;
        existingAdmin.lastName = adminData.lastName;
        await existingAdmin.save();
        
        console.log(`✅ Admin password updated successfully for ${adminData.email}!`);
      } else {
        console.log(`🆕 Creating new admin user: ${adminData.email}`);
        
        // Create new admin user
        const hashedPassword = await hashPassword(adminData.password);
        
        const admin = new User({
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          password: hashedPassword,
          role: "admin",
          emailVerified: true,
          profileCompleted: true
        });

        await admin.save();
        console.log(`✅ Admin user created successfully for ${adminData.email}!`);
      }
    }

    console.log("\n🎉 All admin users processed!");
    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin 1:");
    console.log("Email: riaz90603@gmail.com");
    console.log("Password: aszx1234");
    console.log("Role: admin");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin 2:");
    console.log("Email: monkmaze@gmail.com");
    console.log("Password: monkmaze123");
    console.log("Role: admin");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from database");
  }
};

createAdmin();
