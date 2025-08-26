import nodemailer from "nodemailer";
import dotenv from "dotenv";
import twilio from "twilio";
dotenv.config();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Welkome" <support@welkome.com>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP sent to email: ${email}`);
};

export const sendSMS = async (phone, otp) => {
  try {
    const message = await twilioClient.messages.create({
      body: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(`OTP sent to phone: ${phone}, SID: ${message.sid}`);
  } catch (error) {
    console.error("Failed to send SMS:", error.message);
    throw new Error("Failed to send SMS");
  }
};


export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:5000/api/v1/auth/verify-email?token=${token}&email=${email}`;

  const mailOptions = {
    from: `"MyApp" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email",
    html: `
      <h2>Email Verification</h2>
      <p>Click the button below to verify your account:</p>
      <a href="${verificationUrl}" style="padding:10px 20px;background-color:#28a745;color:#fff;text-decoration:none;">Verify Email</a>
      <p>This link will expire in 15 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Verification email sent to ${email}`);
};
