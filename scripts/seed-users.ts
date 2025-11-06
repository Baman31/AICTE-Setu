import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";

async function seedUsers() {
  try {
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const testUsers = [
      {
        email: "institution@example.com",
        password: hashedPassword,
        role: "institution" as const,
        name: "Test Institution",
      },
      {
        email: "evaluator@example.com",
        password: hashedPassword,
        role: "evaluator" as const,
        name: "Test Evaluator",
      },
      {
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin" as const,
        name: "Test Admin",
      },
    ];

    for (const user of testUsers) {
      const existing = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, user.email),
      });

      if (!existing) {
        await db.insert(users).values(user);
        console.log(`✓ Created user: ${user.email}`);
      } else {
        console.log(`- User already exists: ${user.email}`);
      }
    }

    console.log("\n✅ User seeding completed!");
    console.log("\nTest credentials:");
    console.log("- Institution: institution@example.com / password123");
    console.log("- Evaluator: evaluator@example.com / password123");
    console.log("- Admin: admin@example.com / password123");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
