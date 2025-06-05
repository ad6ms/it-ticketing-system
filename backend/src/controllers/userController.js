const bcrypt = require("bcrypt");
const prisma = require("../../prismaClient");

const registerUser = async (request, response) => {
  const { email, password, name } = request.body;

  if (!email || !password) {
    return response
      .status(400)
      .json({ message: "Email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return response.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  } catch (error) {
    console.error("error");
    response
      .status(500)
      .json({ message: "Server error, please try again later" });
  }

  module.exports = {
    registerUser,
  };
};
