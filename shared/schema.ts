import { z } from "zod";
import { ObjectId } from "mongodb";

export const userRoleValues = ["institution", "evaluator", "admin"] as const;
export const applicationStatusValues = [
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
] as const;
export const applicationTypeValues = [
  "new-institution",
  "intake-increase",
  "new-course",
  "eoa",
  "location-change"
] as const;
export const priorityValues = ["low", "medium", "high"] as const;
export const stageStatusValues = ["pending", "current", "completed"] as const;
export const assignmentStatusValues = ["pending", "in_progress", "completed", "overdue"] as const;
export const notificationTypeValues = ["info", "warning", "success", "error", "assignment", "status_update"] as const;
export const facilityTypeValues = ["classroom", "laboratory", "library", "workshop", "sports", "hostel", "cafeteria", "auditorium", "other"] as const;

export interface User {
  _id: string;
  email: string;
  password: string;
  role: typeof userRoleValues[number];
  name: string;
  fullname?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Institution {
  _id: string;
  userId: string;
  name: string;
  address: string;
  state: string;
  affiliationType?: string;
  contactPerson?: string;
  contactEmail: string;
  contactPhone?: string;
  establishedDate?: Date;
  createdAt: Date;
}

export interface Application {
  _id: string;
  applicationNumber: string;
  institutionId: string;
  applicationType: typeof applicationTypeValues[number];
  programType?: string;
  status: typeof applicationStatusValues[number];
  institutionName: string;
  address: string;
  state: string;
  courseName?: string;
  intake?: number;
  description?: string;
  formData?: any;
  processingTime?: number;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  _id: string;
  applicationId: string;
  category: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  status: string;
  verified: boolean;
  uploadedAt: Date;
}

export interface EvaluatorAssignment {
  _id: string;
  applicationId: string;
  evaluatorId: string;
  priority: typeof priorityValues[number];
  status?: typeof assignmentStatusValues[number];
  deadline?: Date;
  assignedAt: Date;
  completedAt?: Date;
}

export interface Evaluation {
  _id: string;
  assignmentId: string;
  applicationId: string;
  evaluatorId: string;
  score?: number;
  comments?: any;
  recommendation?: string;
  approved?: boolean;
  siteVisitNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  applicationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface TimelineStage {
  _id: string;
  applicationId: string;
  title: string;
  description?: string;
  status: typeof stageStatusValues[number];
  assignedTo?: string;
  stageStartDate?: Date;
  timeline?: any;
  daysElapsed?: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface Notification {
  _id: string;
  userId: string;
  type: typeof notificationTypeValues[number];
  message: string;
  isRead: boolean;
  sentAt: Date;
}

export interface AuditLog {
  _id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  timestamp: Date;
}

export interface AnalyticsMetric {
  _id: string;
  metricType: string;
  recordDate: Date;
  data?: any;
  value?: number;
}

export interface InfrastructureImage {
  _id: string;
  applicationId: string;
  imageUrl: string;
  facilityType: typeof facilityTypeValues[number];
  geoCoordinates?: any;
  uploadDate: Date;
}

export interface CvAnalysis {
  _id: string;
  imageId: string;
  dimensions?: any;
  detectedFeatures?: any;
  meetsStandards?: boolean;
  accuracyScore?: number;
  remarks?: string;
  analyzedAt: Date;
}

export interface VerificationResult {
  _id: string;
  documentId: string;
  verificationType: string;
  confidenceScore?: number;
  extractedData?: any;
  isCompliant?: boolean;
  remarks?: string;
  verifiedAt: Date;
}

export interface Evaluator {
  _id: string;
  userId: string;
  expertise?: string;
  department?: string;
  currentWorkload: number;
  avgReviewTime?: number;
  available: boolean;
  createdAt: Date;
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.enum(userRoleValues),
  name: z.string(),
  fullname: z.string().optional(),
  phone: z.string().optional(),
  lastLogin: z.date().optional(),
});

export const selectUserSchema = z.object({
  _id: z.string(),
  email: z.string(),
  password: z.string(),
  role: z.enum(userRoleValues),
  name: z.string(),
  fullname: z.string().optional(),
  phone: z.string().optional(),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
});

export const insertInstitutionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  address: z.string(),
  state: z.string(),
  affiliationType: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  establishedDate: z.date().optional(),
});

export const selectInstitutionSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  name: z.string(),
  address: z.string(),
  state: z.string(),
  affiliationType: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  establishedDate: z.date().optional(),
  createdAt: z.date(),
});

export const insertApplicationSchema = z.object({
  institutionId: z.string(),
  applicationType: z.enum(applicationTypeValues),
  programType: z.string().optional(),
  status: z.enum(applicationStatusValues).default("draft"),
  institutionName: z.string(),
  address: z.string(),
  state: z.string(),
  courseName: z.string().optional(),
  intake: z.number().int().optional(),
  description: z.string().optional(),
  formData: z.any().optional(),
  processingTime: z.number().optional(),
  submittedAt: z.date().optional(),
});

export const selectApplicationSchema = z.object({
  _id: z.string(),
  applicationNumber: z.string(),
  institutionId: z.string(),
  applicationType: z.enum(applicationTypeValues),
  programType: z.string().optional(),
  status: z.enum(applicationStatusValues),
  institutionName: z.string(),
  address: z.string(),
  state: z.string(),
  courseName: z.string().optional(),
  intake: z.number().int().optional(),
  description: z.string().optional(),
  formData: z.any().optional(),
  processingTime: z.number().optional(),
  submittedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertDocumentSchema = z.object({
  applicationId: z.string(),
  category: z.string(),
  fileName: z.string(),
  fileSize: z.string(),
  fileUrl: z.string(),
  status: z.string().default("pending"),
  verified: z.boolean().default(false),
});

export const selectDocumentSchema = z.object({
  _id: z.string(),
  applicationId: z.string(),
  category: z.string(),
  fileName: z.string(),
  fileSize: z.string(),
  fileUrl: z.string(),
  status: z.string(),
  verified: z.boolean(),
  uploadedAt: z.date(),
});

export const insertEvaluatorAssignmentSchema = z.object({
  applicationId: z.string(),
  evaluatorId: z.string(),
  priority: z.enum(priorityValues).default("medium"),
  status: z.enum(assignmentStatusValues).optional(),
  deadline: z.date().optional(),
  completedAt: z.date().optional(),
});

export const selectEvaluatorAssignmentSchema = z.object({
  _id: z.string(),
  applicationId: z.string(),
  evaluatorId: z.string(),
  priority: z.enum(priorityValues),
  status: z.enum(assignmentStatusValues).optional(),
  deadline: z.date().optional(),
  assignedAt: z.date(),
  completedAt: z.date().optional(),
});

export const insertEvaluationSchema = z.object({
  assignmentId: z.string(),
  applicationId: z.string(),
  evaluatorId: z.string(),
  score: z.number().optional(),
  comments: z.any().optional(),
  recommendation: z.string().optional(),
  approved: z.boolean().optional(),
  siteVisitNotes: z.string().optional(),
});

export const selectEvaluationSchema = z.object({
  _id: z.string(),
  assignmentId: z.string(),
  applicationId: z.string(),
  evaluatorId: z.string(),
  score: z.number().optional(),
  comments: z.any().optional(),
  recommendation: z.string().optional(),
  approved: z.boolean().optional(),
  siteVisitNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertMessageSchema = z.object({
  applicationId: z.string(),
  senderId: z.string(),
  content: z.string(),
});

export const selectMessageSchema = z.object({
  _id: z.string(),
  applicationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  createdAt: z.date(),
});

export const insertTimelineStageSchema = z.object({
  applicationId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(stageStatusValues).default("pending"),
  assignedTo: z.string().optional(),
  stageStartDate: z.date().optional(),
  timeline: z.any().optional(),
  daysElapsed: z.number().int().optional(),
  completedAt: z.date().optional(),
});

export const selectTimelineStageSchema = z.object({
  _id: z.string(),
  applicationId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(stageStatusValues),
  assignedTo: z.string().optional(),
  stageStartDate: z.date().optional(),
  timeline: z.any().optional(),
  daysElapsed: z.number().int().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(notificationTypeValues).default("info"),
  message: z.string(),
  isRead: z.boolean().default(false),
});

export const selectNotificationSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  type: z.enum(notificationTypeValues),
  message: z.string(),
  isRead: z.boolean(),
  sentAt: z.date(),
});

export const insertAuditLogSchema = z.object({
  userId: z.string().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  changes: z.any().optional(),
});

export const selectAuditLogSchema = z.object({
  _id: z.string(),
  userId: z.string().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  changes: z.any().optional(),
  timestamp: z.date(),
});

export const insertAnalyticsMetricSchema = z.object({
  metricType: z.string(),
  data: z.any().optional(),
  value: z.number().optional(),
});

export const selectAnalyticsMetricSchema = z.object({
  _id: z.string(),
  metricType: z.string(),
  recordDate: z.date(),
  data: z.any().optional(),
  value: z.number().optional(),
});

export const insertInfrastructureImageSchema = z.object({
  applicationId: z.string(),
  imageUrl: z.string(),
  facilityType: z.enum(facilityTypeValues),
  geoCoordinates: z.any().optional(),
});

export const selectInfrastructureImageSchema = z.object({
  _id: z.string(),
  applicationId: z.string(),
  imageUrl: z.string(),
  facilityType: z.enum(facilityTypeValues),
  geoCoordinates: z.any().optional(),
  uploadDate: z.date(),
});

export const insertCvAnalysisSchema = z.object({
  imageId: z.string(),
  dimensions: z.any().optional(),
  detectedFeatures: z.any().optional(),
  meetsStandards: z.boolean().optional(),
  accuracyScore: z.number().optional(),
  remarks: z.string().optional(),
});

export const selectCvAnalysisSchema = z.object({
  _id: z.string(),
  imageId: z.string(),
  dimensions: z.any().optional(),
  detectedFeatures: z.any().optional(),
  meetsStandards: z.boolean().optional(),
  accuracyScore: z.number().optional(),
  remarks: z.string().optional(),
  analyzedAt: z.date(),
});

export const insertVerificationResultSchema = z.object({
  documentId: z.string(),
  verificationType: z.string(),
  confidenceScore: z.number().optional(),
  extractedData: z.any().optional(),
  isCompliant: z.boolean().optional(),
  remarks: z.string().optional(),
});

export const selectVerificationResultSchema = z.object({
  _id: z.string(),
  documentId: z.string(),
  verificationType: z.string(),
  confidenceScore: z.number().optional(),
  extractedData: z.any().optional(),
  isCompliant: z.boolean().optional(),
  remarks: z.string().optional(),
  verifiedAt: z.date(),
});

export const insertEvaluatorSchema = z.object({
  userId: z.string(),
  expertise: z.string().optional(),
  department: z.string().optional(),
  currentWorkload: z.number().int().default(0),
  avgReviewTime: z.number().optional(),
  available: z.boolean().default(true),
});

export const selectEvaluatorSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  expertise: z.string().optional(),
  department: z.string().optional(),
  currentWorkload: z.number().int(),
  avgReviewTime: z.number().optional(),
  available: z.boolean(),
  createdAt: z.date(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertEvaluatorAssignment = z.infer<typeof insertEvaluatorAssignmentSchema>;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertTimelineStage = z.infer<typeof insertTimelineStageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;
export type InsertInfrastructureImage = z.infer<typeof insertInfrastructureImageSchema>;
export type InsertCvAnalysis = z.infer<typeof insertCvAnalysisSchema>;
export type InsertVerificationResult = z.infer<typeof insertVerificationResultSchema>;
export type InsertEvaluator = z.infer<typeof insertEvaluatorSchema>;

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

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["admin", "evaluator", "institution"]).optional(),
});

export const createApplicationSchema = z.object({
  applicationType: z.enum(applicationTypeValues),
  institutionName: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  courseName: z.string().optional(),
  intake: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const assignEvaluatorSchema = z.object({
  applicationId: z.string(),
  evaluatorId: z.string(),
  priority: z.enum(priorityValues).optional(),
  deadline: z.string().datetime().optional(),
});

export const submitEvaluationSchema = z.object({
  assignmentId: z.string(),
  applicationId: z.string(),
  score: z.number().int().min(0).max(100).optional(),
  comments: z.string().optional(),
  recommendation: z.string().optional(),
  siteVisitNotes: z.string().optional(),
});

export const sendMessageSchema = z.object({
  applicationId: z.string(),
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
  status: z.enum(applicationStatusValues),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type AssignEvaluatorInput = z.infer<typeof assignEvaluatorSchema>;
export type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
