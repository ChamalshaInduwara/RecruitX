import bcrypt from "bcrypt";
import prisma from "../config/prisma";

async function createAdmin() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be provided"
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    console.log("An account with this email already exists.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("RecruitX admin created successfully.");
  console.log(`Name: ${admin.name}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
}

createAdmin()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });