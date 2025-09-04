import jwt from "jsonwebtoken";

export const generateJwtToken = async(userId, email, role) => {
  try {
    const payload = { userId, email, role };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return token;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};
