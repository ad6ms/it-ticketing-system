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

module.exports = {
  registerUser,
};
