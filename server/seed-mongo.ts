import { connectDB, closeDB } from "./db";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function seedMongoDB() {
  console.log("🌱 Seeding MongoDB database...");

  try {
    const db = await connectDB();
    
    const hashedPassword = await bcrypt.hash("password123", 10);

    console.log("Creating users...");
    const adminUserId = crypto.randomUUID();
    const evaluatorUserId = crypto.randomUUID();
    const institutionUserId = crypto.randomUUID();

    await db.collection('users').deleteMany({});
    
    await db.collection('users').insertMany([
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

    console.log("Creating institution...");
    const institutionId = crypto.randomUUID();
    
    await db.collection('institutions').deleteMany({});
    
    await db.collection('institutions').insertOne({
      _id: institutionId,
      userId: institutionUserId,
      name: "Indian Institute of Technology, Mumbai",
      address: "Powai, Mumbai",
      state: "Maharashtra",
      contactEmail: "iit@institution.edu",
      contactPhone: "+91 22 2576 8000",
      createdAt: new Date(),
    });

    console.log("Creating applications...");
    const app1Id = crypto.randomUUID();
    const app2Id = crypto.randomUUID();
    const app3Id = crypto.randomUUID();

    await db.collection('applications').deleteMany({});
    
    await db.collection('applications').insertMany([
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
      {
        _id: app2Id,
        institutionId: institutionId,
        applicationNumber: "APP-2025-001189",
        applicationType: "intake-increase",
        status: "document_verification",
        institutionName: "Indian Institute of Technology, Mumbai",
        address: "Powai, Mumbai",
        state: "Maharashtra",
        courseName: "M.Tech in Data Science",
        intake: 60,
        description: "Increase intake for M.Tech program",
        submittedAt: new Date("2025-01-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: app3Id,
        institutionId: institutionId,
        applicationNumber: "APP-2024-009876",
        applicationType: "eoa",
        status: "approved",
        institutionName: "Indian Institute of Technology, Mumbai",
        address: "Powai, Mumbai",
        state: "Maharashtra",
        courseName: "B.Tech in Electronics",
        intake: 100,
        description: "Extension of Approval",
        submittedAt: new Date("2024-12-20"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("Creating evaluator profile...");
    await db.collection('evaluators').deleteMany({});
    
    await db.collection('evaluators').insertOne({
      _id: crypto.randomUUID(),
      userId: evaluatorUserId,
      expertise: "Computer Science & Engineering",
      department: "Technical Education",
      currentWorkload: 1,
      available: true,
    });

    console.log("Creating evaluator assignment...");
    await db.collection('evaluatorAssignments').deleteMany({});
    
    await db.collection('evaluatorAssignments').insertOne({
      _id: crypto.randomUUID(),
      applicationId: app1Id,
      evaluatorId: evaluatorUserId,
      priority: "high",
      deadline: new Date("2025-01-25"),
      assignedAt: new Date(),
    });

    console.log("Creating timeline stages...");
    await db.collection('timelineStages').deleteMany({});
    
    await db.collection('timelineStages').insertMany([
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        title: "Application Submitted",
        description: "Application received and under initial review",
        status: "completed",
        completedAt: new Date("2025-01-15"),
        createdAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        title: "Initial Scrutiny",
        description: "Basic compliance checks completed",
        status: "completed",
        completedAt: new Date("2025-01-16"),
        createdAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        title: "Document Verification",
        description: "AI-powered document analysis completed with 95% compliance",
        status: "completed",
        completedAt: new Date("2025-01-17"),
        createdAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        title: "Evaluator Assignment",
        description: "Expert evaluator assigned for detailed review",
        status: "current",
        assignedTo: "Dr. Rajesh Kumar",
        createdAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        title: "Site Visit & Evaluation",
        description: "Pending site visit scheduling",
        status: "pending",
        createdAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        title: "Final Approval",
        description: "Pending final review",
        status: "pending",
        createdAt: new Date(),
      },
    ]);

    console.log("Creating documents...");
    await db.collection('documents').deleteMany({});
    
    await db.collection('documents').insertMany([
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        category: "Academic Records",
        fileName: "affiliation_certificate.pdf",
        fileSize: "2.3 MB",
        fileUrl: "https://storage.example.com/docs/affiliation_certificate.pdf",
        status: "approved",
        verified: true,
        uploadedAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        category: "Faculty Details",
        fileName: "faculty_qualifications.pdf",
        fileSize: "1.5 MB",
        fileUrl: "https://storage.example.com/docs/faculty_qualifications.pdf",
        status: "approved",
        verified: true,
        uploadedAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        category: "Infrastructure Documents",
        fileName: "lab_facilities.pdf",
        fileSize: "3.8 MB",
        fileUrl: "https://storage.example.com/docs/lab_facilities.pdf",
        status: "pending",
        verified: false,
        uploadedAt: new Date(),
      },
    ]);

    console.log("Creating messages for real-time communication...");
    await db.collection('messages').deleteMany({});
    
    await db.collection('messages').insertMany([
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        senderId: institutionUserId,
        content: "We have submitted all required documents for the new Computer Science program. Please review at your earliest convenience.",
        createdAt: new Date("2025-01-18T10:00:00Z"),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        senderId: adminUserId,
        content: "Thank you for your submission. Your application has been assigned to Dr. Rajesh Kumar for evaluation.",
        createdAt: new Date("2025-01-18T11:30:00Z"),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        senderId: evaluatorUserId,
        content: "I have reviewed the initial documents. The infrastructure looks promising. I would like to schedule a site visit for next week. Could you please confirm your availability?",
        createdAt: new Date("2025-01-19T09:15:00Z"),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        senderId: institutionUserId,
        content: "Thank you Dr. Kumar. We are available next week Tuesday through Thursday. Please let us know which day works best for you.",
        createdAt: new Date("2025-01-19T14:20:00Z"),
      },
      {
        _id: crypto.randomUUID(),
        applicationId: app1Id,
        senderId: evaluatorUserId,
        content: "Perfect! I will schedule the site visit for Wednesday, February 14th at 10:00 AM. Please ensure all lab facilities are accessible for inspection.",
        createdAt: new Date("2025-01-20T08:45:00Z"),
      },
    ]);

    console.log("Creating notifications...");
    await db.collection('notifications').deleteMany({});
    
    await db.collection('notifications').insertMany([
      {
        _id: crypto.randomUUID(),
        userId: institutionUserId,
        type: "assignment",
        message: "Your application APP-2025-001234 has been assigned to Dr. Rajesh Kumar",
        isRead: false,
        sentAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        userId: evaluatorUserId,
        type: "assignment",
        message: "New application assigned: APP-2025-001234 - IIT Mumbai",
        isRead: true,
        sentAt: new Date(),
      },
      {
        _id: crypto.randomUUID(),
        userId: adminUserId,
        type: "info",
        message: "Application APP-2025-001234 is progressing on schedule",
        isRead: false,
        sentAt: new Date(),
      },
    ]);

    console.log("\n✅ MongoDB database seeded successfully!");
    console.log("\n=== TEST CREDENTIALS ===");
    console.log("\n👤 Admin:");
    console.log("   Email: admin@aicte.gov.in");
    console.log("   Password: password123");
    console.log("\n👨‍🏫 Evaluator:");
    console.log("   Email: evaluator@aicte.gov.in");
    console.log("   Password: password123");
    console.log("\n🏛️ Institution:");
    console.log("   Email: iit@institution.edu");
    console.log("   Password: password123");
    console.log("\n========================");
    console.log("\n📝 Sample Data Created:");
    console.log("   - 3 Users (Admin, Evaluator, Institution)");
    console.log("   - 1 Institution");
    console.log("   - 3 Applications");
    console.log("   - 3 Documents");
    console.log("   - 5 Messages (demonstrating Institution ↔ Evaluator ↔ Admin communication)");
    console.log("   - 6 Timeline Stages");
    console.log("   - 3 Notifications");
    console.log("   - 1 Evaluator Profile");
    console.log("\n💬 Messages feature is ready for real-time communication between all user roles!\n");

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await closeDB();
    process.exit(1);
  }
}

seedMongoDB();
