import { db } from "./db";
import { users, institutions, applications, evaluatorAssignments, timelineStages } from "../shared/schema";
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

  console.log("Database seeded successfully!");
  console.log("\nTest Accounts:");
  console.log("Admin: admin@aicte.gov.in / password123");
  console.log("Evaluator: evaluator@aicte.gov.in / password123");
  console.log("Institution: iit@institution.edu / password123");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
