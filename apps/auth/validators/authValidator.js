import jwt from "jsonwebtoken";
import User from "../../user/models/userModel.js";

//The flutter dev will set the token in the header on  his own the token is available in the in user response

export const isLoggedIn = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided, Unauthorized!" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and check if the token matches the one stored in DB
    const user = await User.findById(decodedToken.userId).select("-password");

    if (!user || user.token !== token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid token or user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message || "Unauthorized" });
  }
};

//not confirmed yet
