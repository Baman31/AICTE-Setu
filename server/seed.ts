import { db } from "./db";
import { 
  users, institutions, applications, evaluatorAssignments, timelineStages, 
  messages, documents, evaluations, notifications, evaluators 
} from "../shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const [adminUser] = await db.insert(users).values({
    email: "admin@aicte.gov.in",
    password: hashedPassword,
    name: "Admin User",
    role: "admin",
  }).returning();

  const [evaluatorUser] = await db.insert(users).values({
    email: "evaluator@aicte.gov.in",
    password: hashedPassword,
    name: "Dr. Rajesh Kumar",
    role: "evaluator",
  }).returning();

  const [institutionUser] = await db.insert(users).values({
    email: "iit@institution.edu",
    password: hashedPassword,
    name: "IIT Mumbai",
    role: "institution",
  }).returning();

  const [institution] = await db.insert(institutions).values({
    userId: institutionUser.id,
    name: "Indian Institute of Technology, Mumbai",
    address: "Powai, Mumbai",
    state: "Maharashtra",
    contactEmail: "iit@institution.edu",
    contactPhone: "+91 22 2576 8000",
  }).returning();

  const [app1] = await db.insert(applications).values({
    institutionId: institution.id,
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
  }).returning();

  const [app2] = await db.insert(applications).values({
    institutionId: institution.id,
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
  }).returning();

  const [app3] = await db.insert(applications).values({
    institutionId: institution.id,
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
  }).returning();

  await db.insert(evaluatorAssignments).values({
    applicationId: app1.id,
    evaluatorId: evaluatorUser.id,
    priority: "high",
    deadline: new Date("2025-01-25"),
  });

  await db.insert(timelineStages).values([
    {
      applicationId: app1.id,
      title: "Application Submitted",
      description: "Application received and under initial review",
      status: "completed",
      completedAt: new Date("2025-01-15"),
    },
    {
      applicationId: app1.id,
      title: "Initial Scrutiny",
      description: "Basic compliance checks completed",
      status: "completed",
      completedAt: new Date("2025-01-16"),
    },
    {
      applicationId: app1.id,
      title: "Document Verification",
      description: "AI-powered document analysis completed with 95% compliance",
      status: "completed",
      completedAt: new Date("2025-01-17"),
    },
    {
      applicationId: app1.id,
      title: "Evaluator Assignment",
      description: "Expert evaluator assigned for detailed review",
      status: "current",
      assignedTo: "Dr. Rajesh Kumar",
    },
    {
      applicationId: app1.id,
      title: "Site Visit & Evaluation",
      description: "Pending site visit scheduling",
      status: "pending",
    },
    {
      applicationId: app1.id,
      title: "Final Approval",
      description: "Pending final review",
      status: "pending",
    },
  ]);

  console.log("Creating evaluator profile...");
  await db.insert(evaluators).values({
    userId: evaluatorUser.id,
    expertise: "Computer Science & Engineering",
    department: "Technical Education",
    currentWorkload: 1,
    available: true,
  });

  console.log("Creating documents...");
  await db.insert(documents).values([
    {
      applicationId: app1.id,
      category: "Academic Records",
      fileName: "affiliation_certificate.pdf",
      fileSize: "2.3 MB",
      fileUrl: "https://storage.example.com/docs/affiliation_certificate.pdf",
      status: "approved",
      verified: true,
    },
    {
      applicationId: app1.id,
      category: "Faculty Details",
      fileName: "faculty_qualifications.pdf",
      fileSize: "1.5 MB",
      fileUrl: "https://storage.example.com/docs/faculty_qualifications.pdf",
      status: "approved",
      verified: true,
    },
    {
      applicationId: app1.id,
      category: "Infrastructure Documents",
      fileName: "lab_facilities.pdf",
      fileSize: "3.8 MB",
      fileUrl: "https://storage.example.com/docs/lab_facilities.pdf",
      status: "pending",
      verified: false,
    },
  ]);

  console.log("Creating messages for real-time communication...");
  await db.insert(messages).values([
    {
      applicationId: app1.id,
      senderId: institutionUser.id,
      content: "We have submitted all required documents for the new Computer Science program. Please review at your earliest convenience.",
    },
    {
      applicationId: app1.id,
      senderId: adminUser.id,
      content: "Thank you for your submission. Your application has been assigned to Dr. Rajesh Kumar for evaluation.",
    },
    {
      applicationId: app1.id,
      senderId: evaluatorUser.id,
      content: "I have reviewed the initial documents. The infrastructure looks promising. I would like to schedule a site visit for next week. Could you please confirm your availability?",
    },
    {
      applicationId: app1.id,
      senderId: institutionUser.id,
      content: "Thank you Dr. Kumar. We are available next week Tuesday through Thursday. Please let us know which day works best for you.",
    },
    {
      applicationId: app1.id,
      senderId: evaluatorUser.id,
      content: "Perfect! I will schedule the site visit for Wednesday, February 14th at 10:00 AM. Please ensure all lab facilities are accessible for inspection.",
    },
  ]);

  console.log("Creating notifications...");
  await db.insert(notifications).values([
    {
      userId: institutionUser.id,
      type: "assignment",
      message: "Your application APP-2025-001234 has been assigned to Dr. Rajesh Kumar",
      isRead: false,
    },
    {
      userId: evaluatorUser.id,
      type: "assignment",
      message: "New application assigned: APP-2025-001234 - IIT Mumbai",
      isRead: true,
    },
    {
      userId: adminUser.id,
      type: "info",
      message: "Application APP-2025-001234 is progressing on schedule",
      isRead: false,
    },
  ]);

  console.log("\n✅ Database seeded successfully!");
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
  console.log("   - 3 Applications");
  console.log("   - 3 Documents");
  console.log("   - 5 Messages (demonstrating Institution ↔ Evaluator ↔ Admin communication)");
  console.log("   - 6 Timeline Stages");
  console.log("   - 3 Notifications");
  console.log("\n💬 Messages feature is ready for real-time communication between all user roles!\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
