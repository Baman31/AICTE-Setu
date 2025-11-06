import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.warn("WARNING: MONGODB_URI not set. Using in-memory fallback (data will not persist).");
}

const client = process.env.MONGODB_URI ? new MongoClient(process.env.MONGODB_URI) : null;

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db();
    
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
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
