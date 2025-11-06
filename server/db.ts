import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provide the MongoDB connection string?",
  );
}

const client = new MongoClient(process.env.MONGODB_URI);

let db: Db;
let isSeeded = false;

export async function connectDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db();
    
    await createIndexes(db);
    
    await seedIfNeeded(db);
    
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

async function seedIfNeeded(database: Db) {
  if (isSeeded) return;
  
  if (process.env.NODE_ENV === 'production') {
    console.log("⚠️ Production environment detected - auto-seeding disabled for security.");
    isSeeded = true;
    return;
  }
  
  try {
    const userCount = await database.collection('users').countDocuments();
    
    if (userCount === 0) {
      console.log("📦 Development mode: Database is empty, seeding with test data...");
      await seedDatabase(database);
      isSeeded = true;
    } else {
      console.log("✅ Database already contains data, skipping seed.");
      isSeeded = true;
    }
  } catch (error) {
    console.error("Error checking/seeding database:", error);
  }
}

async function seedDatabase(database: Db) {
  const bcrypt = await import("bcrypt");
  const crypto = await import("crypto");
  
  const hashedPassword = await bcrypt.hash("password123", 10);

  const adminUserId = crypto.randomUUID();
  const evaluatorUserId = crypto.randomUUID();
  const institutionUserId = crypto.randomUUID();

  await database.collection('users').insertMany([
    {
      _id: adminUserId,
      email: "admin@aicte.gov.in",
      password: hashedPassword,
      fullname: "Admin User",
      role: "admin",
      createdAt: new Date(),
      lastLogin: null,
    },
    {
      _id: evaluatorUserId,
      email: "evaluator@aicte.gov.in",
      password: hashedPassword,
      fullname: "Dr. Rajesh Kumar",
      role: "evaluator",
      createdAt: new Date(),
      lastLogin: null,
    },
    {
      _id: institutionUserId,
      email: "iit@institution.edu",
      password: hashedPassword,
      fullname: "IIT Mumbai",
      role: "institution",
      createdAt: new Date(),
      lastLogin: null,
    },
  ]);

  const institutionId = crypto.randomUUID();
  await database.collection('institutions').insertOne({
    _id: institutionId,
    userId: institutionUserId,
    name: "Indian Institute of Technology, Mumbai",
    address: "Powai, Mumbai",
    state: "Maharashtra",
    contactEmail: "iit@institution.edu",
    contactPhone: "+91 22 2576 8000",
    createdAt: new Date(),
  });

  const app1Id = crypto.randomUUID();
  await database.collection('applications').insertMany([
    {
      _id: app1Id,
      institutionId: institutionId,
      applicationNumber: "APP-2025-001234",
      applicationType: "new-institution",
      status: "under_evaluation",
      institutionName: "Indian Institute of Technology, Mumbai",
      address: "Powai, Mumbai",
      state: "Maharashtra",
      courseName: "B.Tech in Computer Science",
      intake: 120,
      description: "New B.Tech program in Computer Science",
      submittedAt: new Date("2025-01-15"),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await database.collection('evaluators').insertOne({
    _id: crypto.randomUUID(),
    userId: evaluatorUserId,
    expertise: "Computer Science & Engineering",
    department: "Technical Education",
    currentWorkload: 1,
    available: true,
  });

  console.log("\n✅ Database seeded successfully!");
  console.log("\n=== TEST CREDENTIALS ===");
  console.log("👤 Admin: admin@aicte.gov.in / password123");
  console.log("👨‍🏫 Evaluator: evaluator@aicte.gov.in / password123");
  console.log("🏛️ Institution: iit@institution.edu / password123");
  console.log("========================\n");
}

async function createIndexes(database: Db) {
  await database.collection("users").createIndex({ email: 1 }, { unique: true });
  await database.collection("applications").createIndex({ applicationNumber: 1 }, { unique: true });
  await database.collection("applications").createIndex({ institutionId: 1 });
  await database.collection("applications").createIndex({ status: 1 });
  await database.collection("documents").createIndex({ applicationId: 1 });
  await database.collection("evaluatorAssignments").createIndex({ applicationId: 1 });
  await database.collection("evaluatorAssignments").createIndex({ evaluatorId: 1 });
  await database.collection("evaluations").createIndex({ applicationId: 1 });
  await database.collection("messages").createIndex({ applicationId: 1 });
  await database.collection("timelineStages").createIndex({ applicationId: 1 });
  await database.collection("notifications").createIndex({ userId: 1 });
  await database.collection("infrastructureImages").createIndex({ applicationId: 1 });
  await database.collection("cvAnalysis").createIndex({ imageId: 1 });
  await database.collection("verificationResults").createIndex({ documentId: 1 });
  await database.collection("evaluators").createIndex({ userId: 1 });
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}
