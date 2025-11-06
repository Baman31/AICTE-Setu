import {
  type User,
  type InsertUser,
  type Institution,
  type InsertInstitution,
  type Application,
  type InsertApplication,
  type Document,
  type InsertDocument,
  type EvaluatorAssignment,
  type InsertEvaluatorAssignment,
  type Evaluation,
  type InsertEvaluation,
  type Message,
  type InsertMessage,
  type TimelineStage,
  type InsertTimelineStage,
  type Notification,
  type InsertNotification,
  type AuditLog,
  type InsertAuditLog,
  type AnalyticsMetric,
  type InsertAnalyticsMetric,
  type InfrastructureImage,
  type InsertInfrastructureImage,
  type CvAnalysis,
  type InsertCvAnalysis,
  type VerificationResult,
  type InsertVerificationResult,
  type Evaluator,
  type InsertEvaluator,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  getInstitution(id: string): Promise<Institution | undefined>;
  getInstitutionByUserId(userId: string): Promise<Institution | undefined>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined>;
  getAllInstitutions(): Promise<Institution[]>;
  
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByInstitutionId(institutionId: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined>;
  getAllApplications(): Promise<Application[]>;
  
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByApplicationId(applicationId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  getEvaluatorAssignment(id: string): Promise<EvaluatorAssignment | undefined>;
  getAssignmentsByEvaluatorId(evaluatorId: string): Promise<EvaluatorAssignment[]>;
  getAssignmentsByApplicationId(applicationId: string): Promise<EvaluatorAssignment[]>;
  createEvaluatorAssignment(assignment: InsertEvaluatorAssignment): Promise<EvaluatorAssignment>;
  updateEvaluatorAssignment(id: string, data: Partial<InsertEvaluatorAssignment>): Promise<EvaluatorAssignment | undefined>;
  
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  getEvaluationByAssignmentId(assignmentId: string): Promise<Evaluation | undefined>;
  getEvaluationsByApplicationId(applicationId: string): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, data: Partial<InsertEvaluation>): Promise<Evaluation | undefined>;
  
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByApplicationId(applicationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  getTimelineStage(id: string): Promise<TimelineStage | undefined>;
  getTimelineStagesByApplicationId(applicationId: string): Promise<TimelineStage[]>;
  createTimelineStage(stage: InsertTimelineStage): Promise<TimelineStage>;
  updateTimelineStage(id: string, data: Partial<InsertTimelineStage>): Promise<TimelineStage | undefined>;
  
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  
  getAuditLog(id: string): Promise<AuditLog | undefined>;
  getAuditLogsByEntityId(entityId: string): Promise<AuditLog[]>;
  getAuditLogsByUserId(userId: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  
  getAnalyticsMetric(id: string): Promise<AnalyticsMetric | undefined>;
  getAnalyticsMetricsByType(metricType: string): Promise<AnalyticsMetric[]>;
  createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  
  getInfrastructureImage(id: string): Promise<InfrastructureImage | undefined>;
  getInfrastructureImagesByApplicationId(applicationId: string): Promise<InfrastructureImage[]>;
  createInfrastructureImage(image: InsertInfrastructureImage): Promise<InfrastructureImage>;
  deleteInfrastructureImage(id: string): Promise<boolean>;
  
  getCvAnalysis(id: string): Promise<CvAnalysis | undefined>;
  getCvAnalysisByImageId(imageId: string): Promise<CvAnalysis | undefined>;
  createCvAnalysis(analysis: InsertCvAnalysis): Promise<CvAnalysis>;
  updateCvAnalysis(id: string, data: Partial<InsertCvAnalysis>): Promise<CvAnalysis | undefined>;
  
  getVerificationResult(id: string): Promise<VerificationResult | undefined>;
  getVerificationResultByDocumentId(documentId: string): Promise<VerificationResult | undefined>;
  createVerificationResult(result: InsertVerificationResult): Promise<VerificationResult>;
  
  getEvaluator(id: string): Promise<Evaluator | undefined>;
  getEvaluatorByUserId(userId: string): Promise<Evaluator | undefined>;
  getAvailableEvaluators(): Promise<Evaluator[]>;
  createEvaluator(evaluator: InsertEvaluator): Promise<Evaluator>;
  updateEvaluator(id: string, data: Partial<InsertEvaluator>): Promise<Evaluator | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private institutions: Map<string, Institution>;
  private applications: Map<string, Application>;
  private documents: Map<string, Document>;
  private evaluatorAssignments: Map<string, EvaluatorAssignment>;
  private evaluations: Map<string, Evaluation>;
  private messages: Map<string, Message>;
  private timelineStages: Map<string, TimelineStage>;
  private notifications: Map<string, Notification>;
  private auditLogs: Map<string, AuditLog>;
  private analyticsMetrics: Map<string, AnalyticsMetric>;
  private infrastructureImages: Map<string, InfrastructureImage>;
  private cvAnalyses: Map<string, CvAnalysis>;
  private verificationResults: Map<string, VerificationResult>;
  private evaluators: Map<string, Evaluator>;
  private applicationCounter: number;

  constructor() {
    this.users = new Map();
    this.institutions = new Map();
    this.applications = new Map();
    this.documents = new Map();
    this.evaluatorAssignments = new Map();
    this.evaluations = new Map();
    this.messages = new Map();
    this.timelineStages = new Map();
    this.notifications = new Map();
    this.auditLogs = new Map();
    this.analyticsMetrics = new Map();
    this.infrastructureImages = new Map();
    this.cvAnalyses = new Map();
    this.verificationResults = new Map();
    this.evaluators = new Map();
    this.applicationCounter = 1000;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      fullname: insertUser.fullname || null,
      phone: insertUser.phone || null,
      lastLogin: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    return this.institutions.get(id);
  }

  async getInstitutionByUserId(userId: string): Promise<Institution | undefined> {
    return Array.from(this.institutions.values()).find((inst) => inst.userId === userId);
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    const id = randomUUID();
    const institution: Institution = {
      ...insertInstitution,
      id,
      affiliationType: insertInstitution.affiliationType || null,
      contactPerson: insertInstitution.contactPerson || null,
      contactPhone: insertInstitution.contactPhone || null,
      establishedDate: insertInstitution.establishedDate || null,
      createdAt: new Date(),
    };
    this.institutions.set(id, institution);
    return institution;
  }

  async updateInstitution(id: string, data: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const institution = this.institutions.get(id);
    if (!institution) return undefined;
    
    const updated: Institution = { ...institution, ...data };
    this.institutions.set(id, updated);
    return updated;
  }

  async getAllInstitutions(): Promise<Institution[]> {
    return Array.from(this.institutions.values());
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByInstitutionId(institutionId: string): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (app) => app.institutionId === institutionId
    );
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const applicationNumber = `APP-${new Date().getFullYear()}-${String(this.applicationCounter++).padStart(6, "0")}`;
    const application: Application = {
      ...insertApplication,
      id,
      applicationNumber,
      status: insertApplication.status || "draft",
      programType: insertApplication.programType || null,
      courseName: insertApplication.courseName || null,
      intake: insertApplication.intake || null,
      description: insertApplication.description || null,
      formData: insertApplication.formData || null,
      processingTime: null,
      submittedAt: insertApplication.submittedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: string, data: Partial<InsertApplication>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updated: Application = {
      ...application,
      ...data,
      updatedAt: new Date(),
    };
    this.applications.set(id, updated);
    return updated;
  }

  async getAllApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByApplicationId(applicationId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.applicationId === applicationId
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      status: insertDocument.status || "pending",
      verified: false,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updated: Document = { ...document, ...data };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getEvaluatorAssignment(id: string): Promise<EvaluatorAssignment | undefined> {
    return this.evaluatorAssignments.get(id);
  }

  async getAssignmentsByEvaluatorId(evaluatorId: string): Promise<EvaluatorAssignment[]> {
    return Array.from(this.evaluatorAssignments.values()).filter(
      (assignment) => assignment.evaluatorId === evaluatorId
    );
  }

  async getAssignmentsByApplicationId(applicationId: string): Promise<EvaluatorAssignment[]> {
    return Array.from(this.evaluatorAssignments.values()).filter(
      (assignment) => assignment.applicationId === applicationId
    );
  }

  async createEvaluatorAssignment(insertAssignment: InsertEvaluatorAssignment): Promise<EvaluatorAssignment> {
    const id = randomUUID();
    const assignment: EvaluatorAssignment = {
      ...insertAssignment,
      id,
      priority: insertAssignment.priority || "medium",
      status: insertAssignment.status || null,
      deadline: insertAssignment.deadline || null,
      assignedAt: new Date(),
      completedAt: insertAssignment.completedAt || null,
    };
    this.evaluatorAssignments.set(id, assignment);
    return assignment;
  }

  async updateEvaluatorAssignment(id: string, data: Partial<InsertEvaluatorAssignment>): Promise<EvaluatorAssignment | undefined> {
    const assignment = this.evaluatorAssignments.get(id);
    if (!assignment) return undefined;
    
    const updated: EvaluatorAssignment = { ...assignment, ...data };
    this.evaluatorAssignments.set(id, updated);
    return updated;
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    return this.evaluations.get(id);
  }

  async getEvaluationByAssignmentId(assignmentId: string): Promise<Evaluation | undefined> {
    return Array.from(this.evaluations.values()).find(
      (evaluation) => evaluation.assignmentId === assignmentId
    );
  }

  async getEvaluationsByApplicationId(applicationId: string): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values()).filter(
      (evaluation) => evaluation.applicationId === applicationId
    );
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const id = randomUUID();
    const evaluation: Evaluation = {
      ...insertEvaluation,
      id,
      score: insertEvaluation.score || null,
      comments: insertEvaluation.comments || null,
      recommendation: insertEvaluation.recommendation || null,
      approved: insertEvaluation.approved || null,
      siteVisitNotes: insertEvaluation.siteVisitNotes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.evaluations.set(id, evaluation);
    return evaluation;
  }

  async updateEvaluation(id: string, data: Partial<InsertEvaluation>): Promise<Evaluation | undefined> {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) return undefined;
    
    const updated: Evaluation = {
      ...evaluation,
      ...data,
      updatedAt: new Date(),
    };
    this.evaluations.set(id, updated);
    return updated;
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByApplicationId(applicationId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (msg) => msg.applicationId === applicationId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getTimelineStage(id: string): Promise<TimelineStage | undefined> {
    return this.timelineStages.get(id);
  }

  async getTimelineStagesByApplicationId(applicationId: string): Promise<TimelineStage[]> {
    return Array.from(this.timelineStages.values()).filter(
      (stage) => stage.applicationId === applicationId
    );
  }

  async createTimelineStage(insertStage: InsertTimelineStage): Promise<TimelineStage> {
    const id = randomUUID();
    const stage: TimelineStage = {
      ...insertStage,
      id,
      status: insertStage.status || "pending",
      description: insertStage.description || null,
      assignedTo: insertStage.assignedTo || null,
      stageStartDate: insertStage.stageStartDate || null,
      timeline: insertStage.timeline || null,
      daysElapsed: insertStage.daysElapsed || null,
      completedAt: insertStage.completedAt || null,
      createdAt: new Date(),
    };
    this.timelineStages.set(id, stage);
    return stage;
  }

  async updateTimelineStage(id: string, data: Partial<InsertTimelineStage>): Promise<TimelineStage | undefined> {
    const stage = this.timelineStages.get(id);
    if (!stage) return undefined;
    
    const updated: TimelineStage = { ...stage, ...data };
    this.timelineStages.set(id, updated);
    return updated;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notif) => notif.userId === userId
    );
  }

  async getUnreadNotificationsByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notif) => notif.userId === userId && !notif.isRead
    );
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      type: insertNotification.type || "info",
      isRead: false,
      sentAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updated: Notification = { ...notification, isRead: true };
    this.notifications.set(id, updated);
    return updated;
  }

  async getAuditLog(id: string): Promise<AuditLog | undefined> {
    return this.auditLogs.get(id);
  }

  async getAuditLogsByEntityId(entityId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(
      (log) => log.entityId === entityId
    );
  }

  async getAuditLogsByUserId(userId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(
      (log) => log.userId === userId
    );
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      id,
      userId: insertLog.userId || null,
      entityId: insertLog.entityId || null,
      changes: insertLog.changes || null,
      timestamp: new Date(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  async getAnalyticsMetric(id: string): Promise<AnalyticsMetric | undefined> {
    return this.analyticsMetrics.get(id);
  }

  async getAnalyticsMetricsByType(metricType: string): Promise<AnalyticsMetric[]> {
    return Array.from(this.analyticsMetrics.values()).filter(
      (metric) => metric.metricType === metricType
    );
  }

  async createAnalyticsMetric(insertMetric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const id = randomUUID();
    const metric: AnalyticsMetric = {
      ...insertMetric,
      id,
      data: insertMetric.data || null,
      value: insertMetric.value || null,
      recordDate: new Date(),
    };
    this.analyticsMetrics.set(id, metric);
    return metric;
  }

  async getInfrastructureImage(id: string): Promise<InfrastructureImage | undefined> {
    return this.infrastructureImages.get(id);
  }

  async getInfrastructureImagesByApplicationId(applicationId: string): Promise<InfrastructureImage[]> {
    return Array.from(this.infrastructureImages.values()).filter(
      (img) => img.applicationId === applicationId
    );
  }

  async createInfrastructureImage(insertImage: InsertInfrastructureImage): Promise<InfrastructureImage> {
    const id = randomUUID();
    const image: InfrastructureImage = {
      ...insertImage,
      id,
      geoCoordinates: insertImage.geoCoordinates || null,
      uploadDate: new Date(),
    };
    this.infrastructureImages.set(id, image);
    return image;
  }

  async deleteInfrastructureImage(id: string): Promise<boolean> {
    return this.infrastructureImages.delete(id);
  }

  async getCvAnalysis(id: string): Promise<CvAnalysis | undefined> {
    return this.cvAnalyses.get(id);
  }

  async getCvAnalysisByImageId(imageId: string): Promise<CvAnalysis | undefined> {
    return Array.from(this.cvAnalyses.values()).find(
      (analysis) => analysis.imageId === imageId
    );
  }

  async createCvAnalysis(insertAnalysis: InsertCvAnalysis): Promise<CvAnalysis> {
    const id = randomUUID();
    const analysis: CvAnalysis = {
      ...insertAnalysis,
      id,
      dimensions: insertAnalysis.dimensions || null,
      detectedFeatures: insertAnalysis.detectedFeatures || null,
      meetsStandards: insertAnalysis.meetsStandards || null,
      accuracyScore: insertAnalysis.accuracyScore || null,
      remarks: insertAnalysis.remarks || null,
      analyzedAt: new Date(),
    };
    this.cvAnalyses.set(id, analysis);
    return analysis;
  }

  async updateCvAnalysis(id: string, data: Partial<InsertCvAnalysis>): Promise<CvAnalysis | undefined> {
    const analysis = this.cvAnalyses.get(id);
    if (!analysis) return undefined;
    
    const updated: CvAnalysis = { ...analysis, ...data };
    this.cvAnalyses.set(id, updated);
    return updated;
  }

  async getVerificationResult(id: string): Promise<VerificationResult | undefined> {
    return this.verificationResults.get(id);
  }

  async getVerificationResultByDocumentId(documentId: string): Promise<VerificationResult | undefined> {
    return Array.from(this.verificationResults.values()).find(
      (result) => result.documentId === documentId
    );
  }

  async createVerificationResult(insertResult: InsertVerificationResult): Promise<VerificationResult> {
    const id = randomUUID();
    const result: VerificationResult = {
      ...insertResult,
      id,
      confidenceScore: insertResult.confidenceScore || null,
      extractedData: insertResult.extractedData || null,
      isCompliant: insertResult.isCompliant || null,
      remarks: insertResult.remarks || null,
      verifiedAt: new Date(),
    };
    this.verificationResults.set(id, result);
    return result;
  }

  async getEvaluator(id: string): Promise<Evaluator | undefined> {
    return this.evaluators.get(id);
  }

  async getEvaluatorByUserId(userId: string): Promise<Evaluator | undefined> {
    return Array.from(this.evaluators.values()).find(
      (evaluator) => evaluator.userId === userId
    );
  }

  async getAvailableEvaluators(): Promise<Evaluator[]> {
    return Array.from(this.evaluators.values()).filter(
      (evaluator) => evaluator.available
    );
  }

  async createEvaluator(insertEvaluator: InsertEvaluator): Promise<Evaluator> {
    const id = randomUUID();
    const evaluator: Evaluator = {
      ...insertEvaluator,
      id,
      expertise: insertEvaluator.expertise || null,
      department: insertEvaluator.department || null,
      currentWorkload: 0,
      avgReviewTime: insertEvaluator.avgReviewTime || null,
      available: true,
      createdAt: new Date(),
    };
    this.evaluators.set(id, evaluator);
    return evaluator;
  }

  async updateEvaluator(id: string, data: Partial<InsertEvaluator>): Promise<Evaluator | undefined> {
    const evaluator = this.evaluators.get(id);
    if (!evaluator) return undefined;
    
    const updated: Evaluator = { ...evaluator, ...data };
    this.evaluators.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
