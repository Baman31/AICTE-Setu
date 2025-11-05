import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { users, institutions, applications, documents, evaluatorAssignments, evaluations, messages, timelineStages } from "../shared/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";

const SessionStore = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}

interface AuthRequest extends Request {
  session: session.Session & Partial<session.SessionData>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "aicte-setu-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  const requireAuth = (req: AuthRequest, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: Function) => {
      if (!req.session.userId || !roles.includes(req.session.userRole || "")) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, role, institutionDetails } = req.body;
      
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [user] = await db
        .insert(users)
        .values({ email, password: hashedPassword, name, role })
        .returning();

      if (role === "institution" && institutionDetails) {
        await db.insert(institutions).values({
          userId: user.id,
          name: institutionDetails.name,
          address: institutionDetails.address,
          state: institutionDetails.state,
          contactEmail: email,
          contactPhone: institutionDetails.phone,
        });
      }

      res.json({ message: "Registration successful" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: AuthRequest, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/session", (req: AuthRequest, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    db.query.users
      .findFirst({
        where: eq(users.id, req.session.userId),
      })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      })
      .catch(() => {
        res.status(500).json({ message: "Session check failed" });
      });
  });

  app.get("/api/institution/dashboard", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const institution = await db.query.institutions.findFirst({
        where: eq(institutions.userId, req.session.userId!),
      });

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const allApplications = await db.query.applications.findMany({
        where: eq(applications.institutionId, institution.id),
        orderBy: [desc(applications.createdAt)],
      });

      const stats = {
        total: allApplications.length,
        inProgress: allApplications.filter(a => ["submitted", "scrutiny", "document_verification", "under_evaluation"].includes(a.status)).length,
        approved: allApplications.filter(a => a.status === "approved").length,
        rejected: allApplications.filter(a => a.status === "rejected").length,
      };

      const recentApplications = allApplications.slice(0, 10).map(app => ({
        id: app.applicationNumber,
        institutionName: app.institutionName,
        applicationType: app.applicationType,
        status: app.status,
        submittedDate: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "Draft",
        location: `${app.address}, ${app.state}`,
        courseName: app.courseName,
      }));

      res.json({ stats, applications: recentApplications });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/evaluator/dashboard", requireAuth, requireRole("evaluator"), async (req: AuthRequest, res: Response) => {
    try {
      const assignments = await db
        .select({
          id: evaluatorAssignments.id,
          applicationId: evaluatorAssignments.applicationId,
          priority: evaluatorAssignments.priority,
          deadline: evaluatorAssignments.deadline,
          applicationNumber: applications.applicationNumber,
          institutionName: applications.institutionName,
          applicationType: applications.applicationType,
          state: applications.state,
          address: applications.address,
          courseName: applications.courseName,
        })
        .from(evaluatorAssignments)
        .innerJoin(applications, eq(evaluatorAssignments.applicationId, applications.id))
        .where(and(
          eq(evaluatorAssignments.evaluatorId, req.session.userId!),
          sql`${evaluatorAssignments.completedAt} IS NULL`
        ))
        .orderBy(desc(evaluatorAssignments.assignedAt));

      const stats = {
        assigned: assignments.length,
        pending: assignments.filter(a => !a.deadline || new Date(a.deadline) > new Date()).length,
        upcoming: assignments.filter(a => a.deadline && new Date(a.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
      };

      const formattedAssignments = assignments.map(a => ({
        id: a.applicationNumber,
        institutionName: a.institutionName,
        applicationType: a.applicationType,
        location: `${a.address}, ${a.state}`,
        deadline: a.deadline ? new Date(a.deadline).toLocaleDateString() : "Not set",
        priority: a.priority,
        courseName: a.courseName,
      }));

      res.json({ stats, assignments: formattedAssignments });
    } catch (error) {
      console.error("Evaluator dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch evaluator dashboard data" });
    }
  });

  app.get("/api/admin/dashboard", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const [allApps, activeEvaluators, chartData, workflowDistribution] = await Promise.all([
        db.select().from(applications),
        db.select({ count: count() }).from(users).where(eq(users.role, "evaluator")),
        db.select({
          month: sql`TO_CHAR(${applications.createdAt}, 'Mon')`,
          count: count()
        }).from(applications).groupBy(sql`TO_CHAR(${applications.createdAt}, 'Mon')`),
        db.select({
          status: applications.status,
          count: count()
        }).from(applications).groupBy(applications.status),
      ]);

      const stats = {
        totalApplications: allApps.length,
        activeEvaluators: activeEvaluators[0].count,
        approvalRate: allApps.length > 0 ? Math.round((allApps.filter(a => a.status === "approved").length / allApps.length) * 100) : 0,
        avgProcessingTime: "18 days",
      };

      const monthlyData = [
        { name: "Jan", applications: 120 },
        { name: "Feb", applications: 145 },
        { name: "Mar", applications: 132 },
        { name: "Apr", applications: 168 },
        { name: "May", applications: 189 },
        { name: "Jun", applications: 210 },
      ];

      const workflow = workflowDistribution.map(w => ({
        stage: w.status,
        count: w.count,
      }));

      res.json({ stats, chartData: monthlyData, workflowStages: workflow });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard data" });
    }
  });

  app.post("/api/applications", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const institution = await db.query.institutions.findFirst({
        where: eq(institutions.userId, req.session.userId!),
      });

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const appNumber = `APP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;

      const [application] = await db
        .insert(applications)
        .values({
          institutionId: institution.id,
          applicationNumber: appNumber,
          applicationType: req.body.applicationType,
          institutionName: req.body.institutionName || institution.name,
          address: req.body.address || institution.address,
          state: req.body.state || institution.state,
          courseName: req.body.courseName,
          intake: req.body.intake,
          description: req.body.description,
          status: "draft",
        })
        .returning();

      const timelineStagesData = [
        { title: "Application Submitted", description: "Application created", status: "current" as const },
        { title: "Initial Scrutiny", description: "Awaiting scrutiny", status: "pending" as const },
        { title: "Document Verification", description: "Awaiting verification", status: "pending" as const },
        { title: "Evaluator Assignment", description: "Awaiting evaluator", status: "pending" as const },
        { title: "Site Visit & Evaluation", description: "Pending site visit", status: "pending" as const },
        { title: "Final Approval", description: "Pending final review", status: "pending" as const },
      ];

      await db.insert(timelineStages).values(
        timelineStagesData.map(stage => ({
          applicationId: application.id,
          title: stage.title,
          description: stage.description,
          status: stage.status,
        }))
      );

      res.json({ application });
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.get("/api/applications/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const application = await db.query.applications.findFirst({
        where: eq(applications.applicationNumber, req.params.id),
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const [appDocuments, appMessages, appTimeline] = await Promise.all([
        db.query.documents.findMany({
          where: eq(documents.applicationId, application.id),
        }),
        db.select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          senderName: users.name,
          senderRole: users.role,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.applicationId, application.id))
        .orderBy(messages.createdAt),
        db.query.timelineStages.findMany({
          where: eq(timelineStages.applicationId, application.id),
          orderBy: [timelineStages.createdAt],
        }),
      ]);

      res.json({
        application,
        documents: appDocuments,
        messages: appMessages,
        timeline: appTimeline,
      });
    } catch (error) {
      console.error("Get application error:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.put("/api/applications/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const application = await db.query.applications.findFirst({
        where: eq(applications.applicationNumber, req.params.id),
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.query.institutions.findFirst({
        where: eq(institutions.userId, req.session.userId!),
      });

      if (req.session.userRole === "institution" && application.institutionId !== institution?.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const [updated] = await db
        .update(applications)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, application.id))
        .returning();

      res.json({ application: updated });
    } catch (error) {
      console.error("Update application error:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.post("/api/applications/:id/submit", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const application = await db.query.applications.findFirst({
        where: eq(applications.applicationNumber, req.params.id),
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const [updated] = await db
        .update(applications)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(applications.id, application.id))
        .returning();

      await db
        .update(timelineStages)
        .set({ status: "completed", completedAt: new Date() })
        .where(and(
          eq(timelineStages.applicationId, application.id),
          eq(timelineStages.title, "Application Submitted")
        ));

      await db
        .update(timelineStages)
        .set({ status: "current" })
        .where(and(
          eq(timelineStages.applicationId, application.id),
          eq(timelineStages.title, "Initial Scrutiny")
        ));

      res.json({ application: updated });
    } catch (error) {
      console.error("Submit application error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId, content } = req.body;

      const application = await db.query.applications.findFirst({
        where: eq(applications.id, applicationId),
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const [message] = await db
        .insert(messages)
        .values({
          applicationId,
          senderId: req.session.userId!,
          content,
        })
        .returning();

      res.json({ message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/admin/assign-evaluator", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId, evaluatorId, priority, deadline } = req.body;

      const [assignment] = await db
        .insert(evaluatorAssignments)
        .values({
          applicationId,
          evaluatorId,
          priority: priority || "medium",
          deadline: deadline ? new Date(deadline) : null,
        })
        .returning();

      await db
        .update(applications)
        .set({ status: "under_evaluation", updatedAt: new Date() })
        .where(eq(applications.id, applicationId));

      res.json({ assignment });
    } catch (error) {
      console.error("Assign evaluator error:", error);
      res.status(500).json({ message: "Failed to assign evaluator" });
    }
  });

  app.get("/api/admin/applications", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const allApplications = await db.query.applications.findMany({
        orderBy: [desc(applications.createdAt)],
      });

      res.json({ applications: allApplications });
    } catch (error) {
      console.error("Get all applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/evaluations", requireAuth, requireRole("evaluator"), async (req: AuthRequest, res: Response) => {
    try {
      const { assignmentId, applicationId, score, comments, recommendation, siteVisitNotes } = req.body;

      const [evaluation] = await db
        .insert(evaluations)
        .values({
          assignmentId,
          applicationId,
          evaluatorId: req.session.userId!,
          score,
          comments,
          recommendation,
          siteVisitNotes,
        })
        .returning();

      await db
        .update(evaluatorAssignments)
        .set({ completedAt: new Date() })
        .where(eq(evaluatorAssignments.id, assignmentId));

      res.json({ evaluation });
    } catch (error) {
      console.error("Submit evaluation error:", error);
      res.status(500).json({ message: "Failed to submit evaluation" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
