import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["institution", "evaluator", "admin"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "scrutiny",
  "document_verification",
  "under_evaluation",
  "site_visit_scheduled",
  "site_visit_completed",
  "final_review",
  "approved",
  "rejected",
  "conditional_approval"
]);
export const applicationTypeEnum = pgEnum("application_type", [
  "new-institution",
  "intake-increase",
  "new-course",
  "eoa",
  "location-change"
]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const stageStatusEnum = pgEnum("stage_status", ["pending", "current", "completed"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationNumber: text("application_number").notNull().unique(),
  institutionId: varchar("institution_id").notNull().references(() => institutions.id),
  applicationType: applicationTypeEnum("application_type").notNull(),
  status: applicationStatusEnum("status").notNull().default("draft"),
  institutionName: text("institution_name").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  courseName: text("course_name"),
  intake: integer("intake"),
  description: text("description"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  category: text("category").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const evaluatorAssignments = pgTable("evaluator_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  evaluatorId: varchar("evaluator_id").notNull().references(() => users.id),
  priority: priorityEnum("priority").notNull().default("medium"),
  deadline: timestamp("deadline"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => evaluatorAssignments.id),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  evaluatorId: varchar("evaluator_id").notNull().references(() => users.id),
  score: integer("score"),
  comments: text("comments"),
  recommendation: text("recommendation"),
  siteVisitNotes: text("site_visit_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timelineStages = pgTable("timeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  title: text("title").notNull(),
  description: text("description"),
  status: stageStatusEnum("status").notNull().default("pending"),
  assignedTo: text("assigned_to"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);
export const insertInstitutionSchema = createInsertSchema(institutions).omit({ id: true, createdAt: true });
export const selectInstitutionSchema = createSelectSchema(institutions);
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true, applicationNumber: true });
export const selectApplicationSchema = createSelectSchema(applications);
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true });
export const selectDocumentSchema = createSelectSchema(documents);
export const insertEvaluatorAssignmentSchema = createInsertSchema(evaluatorAssignments).omit({ id: true, assignedAt: true });
export const selectEvaluatorAssignmentSchema = createSelectSchema(evaluatorAssignments);
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true, createdAt: true, updatedAt: true });
export const selectEvaluationSchema = createSelectSchema(evaluations);
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const selectMessageSchema = createSelectSchema(messages);
export const insertTimelineStageSchema = createInsertSchema(timelineStages).omit({ id: true, createdAt: true });
export const selectTimelineStageSchema = createSelectSchema(timelineStages);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type EvaluatorAssignment = typeof evaluatorAssignments.$inferSelect;
export type InsertEvaluatorAssignment = z.infer<typeof insertEvaluatorAssignmentSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type TimelineStage = typeof timelineStages.$inferSelect;
export type InsertTimelineStage = z.infer<typeof insertTimelineStageSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["institution"]),
  institutionDetails: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    state: z.string().min(1),
    phone: z.string().optional(),
  }).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "evaluator", "institution"]),
});

export const createApplicationSchema = z.object({
  applicationType: z.enum(["new-institution", "intake-increase", "new-course", "eoa", "location-change"]),
  institutionName: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  courseName: z.string().optional(),
  intake: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const assignEvaluatorSchema = z.object({
  applicationId: z.string().uuid(),
  evaluatorId: z.string().uuid(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  deadline: z.string().datetime().optional(),
});

export const submitEvaluationSchema = z.object({
  assignmentId: z.string().uuid(),
  applicationId: z.string().uuid(),
  score: z.number().int().min(0).max(100).optional(),
  comments: z.string().optional(),
  recommendation: z.string().optional(),
  siteVisitNotes: z.string().optional(),
});

export const sendMessageSchema = z.object({
  applicationId: z.string().uuid(),
  content: z.string().min(1, "Message content is required"),
});

export const updateApplicationSchema = z.object({
  institutionName: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  courseName: z.string().optional(),
  intake: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["draft", "submitted", "scrutiny", "document_verification", "under_evaluation", "site_visit_scheduled", "site_visit_completed", "final_review", "approved", "rejected", "conditional_approval"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type AssignEvaluatorInput = z.infer<typeof assignEvaluatorSchema>;
export type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
