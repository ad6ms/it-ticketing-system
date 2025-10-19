const bcrypt = require("bcrypt");
const prisma = require("../../prismaClient");

const generateAuthToken = require("../utils/generateAuthToken");
const sendAuthEmail = require("../utils/sendAuthEmail");

const registerUser = async (request, response) => {
  const { email, password, name } = request.body;

  if (!email || !password || !name) {
    return response
      .status(400)
      .json({ message: "Email, password, and name are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return response.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = generateAuthToken();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "USER",
        verified: false,
        verificationToken,
      },
    });

    await sendAuthEmail({
      to: email,
      subject: "Verify your email for Ticket",
      text: `Your verification code is: ${verificationToken}`,
      html: `<p> Your verification code is ${verificationToken} </p>`,
    });

    const { password: _, ...userWithoutPassword } = user;
    response.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("error");
    response
      .status(500)
      .json({ message: "Server error, please try again later" });
  }
};

const verifyUser = async (request, response) => {
  const { email, verificationToken } = request.body;

  if (!email || !verificationToken) {
    return response
      .status(400)
      .json({ message: "Please provide the email and verification token" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    if (user.verificationToken !== verificationToken) {
      return response
        .status(401)
        .json({ message: "Authentication token incorrect" });
    }

    await prisma.user.update({
      where: { email },
      data: { verified: true, verificationToken: null },
    });
  } catch (error) {
    console.error("Error verifying user", error);
    response.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  verifyUser,
};
