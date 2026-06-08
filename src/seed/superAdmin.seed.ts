import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { env } from "../config/env";
import SuperAdmin from "../models/SuperAdmin.model";

const seedSuperAdmin = async () => {
  try {
    // 1. Connect to DB
    await connectDB();

    // 2. Check if any SuperAdmin record exists
    const count = await SuperAdmin.countDocuments();
    if (count > 0) {
      console.log("Super Admin already seeded");
      process.exit(0);
    }

    // 3. Hash password
    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash("Admin@1234", saltRounds);

    // 4. Create Super Admin
    await SuperAdmin.create({
      name: "Super Admin",
      email: env.SUPERADMIN_EMAIL,
      passwordHash,
    });

    console.log("✅ Super Admin seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
