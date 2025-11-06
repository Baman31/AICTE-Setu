import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { getDB } from "./db";
import { 
  loginSchema, registerSchema, createUserSchema, updateUserSchema, createApplicationSchema, assignEvaluatorSchema, submitEvaluationSchema, sendMessageSchema, updateApplicationSchema, updateApplicationStatusSchema
} from "../shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";
import { fromZodError } from "zod-validation-error";
import crypto from "crypto";
import type { Document, WithId } from "mongodb";

type DocWithStringId = Document & { _id?: string };

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

function mapIdField(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

function mapIdFields(docs: any[]) {
  return docs.map(mapIdField);
}

export async function registerRoutes(app: Express): Promise<Server> {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET environment variable must be set in production");
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
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
      const db = getDB();
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { email, password, name, role, institutionDetails } = validationResult.data;
      
      const existingUser = await db.collection('users').findOne({ email });

      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userId = crypto.randomUUID();
      const user = {
        _id: userId,
        email,
        password: hashedPassword,
        name,
        role: "institution" as const,
        createdAt: new Date(),
      };

      await db.collection('users').insertOne(user);

      if (institutionDetails) {
        const institution = {
          _id: crypto.randomUUID(),
          userId: userId,
          name: institutionDetails.name,
          address: institutionDetails.address,
          state: institutionDetails.state,
          contactEmail: email,
          contactPhone: institutionDetails.phone,
          createdAt: new Date(),
        };
        await db.collection('institutions').insertOne(institution);
      }

      res.json({ message: "Registration successful" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const db = getDB();
      const allUsers = await db.collection('users')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      const usersWithoutPasswords = allUsers.map(user => {
        const { password: _, _id, ...userWithoutPassword } = user;
        return { id: _id, ...userWithoutPassword };
      });

      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/create-user", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const db = getDB();
      const validationResult = createUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { email, password, name, role } = validationResult.data;

      const existingUser = await db.collection('users').findOne({ email });

      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        _id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date(),
      };

      await db.collection('users').insertOne(user);

      const { password: _, _id, ...userWithoutPassword } = user;
      res.json({ user: { id: _id, ...userWithoutPassword } });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const validationResult = updateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const updateData = validationResult.data;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      if (updateData.email) {
        const existingUser = await db.collection('users').findOne({ 
          email: updateData.email,
          _id: { $ne: id }
        } as any);

        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const result = await db.collection('users').findOneAndUpdate(
        { _id: id } as any,
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = result.value;
      const { password: _, _id, ...userWithoutPassword } = updatedUser as any;
      res.json({ user: { id: _id, ...userWithoutPassword } });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const result = await db.collection('users').findOneAndDelete({ _id: id } as any);

      if (!result || !result.value) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { email, password } = validationResult.data;

      const user = await db.collection('users').findOne({ email });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user._id;
      req.session.userRole = user.role;

      const { password: _, _id, ...userWithoutPassword } = user;
      res.json({ user: { id: _id, ...userWithoutPassword } });
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

    const db = getDB();
    db.collection('users')
      .findOne({ _id: req.session.userId })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        const { password: _, _id, ...userWithoutPassword } = user;
        res.json({ user: { id: _id, ...userWithoutPassword } });
      })
      .catch(() => {
        res.status(500).json({ message: "Session check failed" });
      });
  });

  app.get("/api/institution/dashboard", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const allApplications = await db.collection('applications')
        .find({ institutionId: institution._id })
        .sort({ createdAt: -1 })
        .toArray();

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

  app.get("/api/institution/applications", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const allApplications = await db.collection('applications')
        .find({ institutionId: institution._id })
        .sort({ createdAt: -1 })
        .toArray();

      res.json(mapIdFields(allApplications));
    } catch (error) {
      console.error("Get applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/messages/:applicationId", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { applicationId } = req.params;

      const application = await db.collection('applications').findOne({ _id: applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userRole = req.session.userRole;
      const userId = req.session.userId!;

      if (userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Access denied to this application's messages" });
        }
      } else if (userRole === "evaluator") {
        const assignment = await db.collection('evaluatorAssignments').findOne({
          applicationId,
          evaluatorId: userId
        });

        if (!assignment) {
          return res.status(403).json({ message: "Access denied to this application's messages" });
        }
      }

      const allMessages = await db.collection('messages').aggregate([
        { $match: { applicationId } },
        {
          $lookup: {
            from: 'users',
            localField: 'senderId',
            foreignField: '_id',
            as: 'sender'
          }
        },
        { $unwind: '$sender' },
        {
          $project: {
            id: '$_id',
            applicationId: 1,
            senderId: 1,
            senderName: '$sender.name',
            content: 1,
            createdAt: 1
          }
        },
        { $sort: { createdAt: 1 } }
      ]).toArray();

      res.json(allMessages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put("/api/settings/profile", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { name, email } = req.body;

      if (!name && !email) {
        return res.status(400).json({ message: "No updates provided" });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) {
        const existingUser = await db.collection('users').findOne({
          email,
          _id: { $ne: req.session.userId }
        });

        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updateData.email = email;
      }

      const result = await db.collection('users').findOneAndUpdate(
        { _id: req.session.userId } as any,
        { $set: updateData } as any,
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = result.value;
      const { password: _, _id, ...userWithoutPassword } = updatedUser as any;
      res.json({ user: { id: _id, ...userWithoutPassword } });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/settings/password", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      const user = await db.collection('users').findOne({ _id: req.session.userId });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.collection('users').updateOne(
        { _id: req.session.userId },
        { $set: { password: hashedPassword } }
      );

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/evaluator/dashboard", requireAuth, requireRole("evaluator"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const assignments = await db.collection('evaluatorAssignments').aggregate([
        { 
          $match: { 
            evaluatorId: req.session.userId,
            completedAt: null
          } 
        },
        {
          $lookup: {
            from: 'applications',
            localField: 'applicationId',
            foreignField: '_id',
            as: 'application'
          }
        },
        { $unwind: '$application' },
        {
          $project: {
            id: '$_id',
            applicationId: 1,
            priority: 1,
            deadline: 1,
            applicationNumber: '$application.applicationNumber',
            institutionName: '$application.institutionName',
            applicationType: '$application.applicationType',
            state: '$application.state',
            address: '$application.address',
            courseName: '$application.courseName'
          }
        },
        { $sort: { assignedAt: -1 } }
      ]).toArray();

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

  app.get("/api/evaluator/applications", requireAuth, requireRole("evaluator"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const assignedApps = await db.collection('evaluatorAssignments').aggregate([
        { $match: { evaluatorId: req.session.userId } },
        {
          $lookup: {
            from: 'applications',
            localField: 'applicationId',
            foreignField: '_id',
            as: 'application'
          }
        },
        { $unwind: '$application' },
        {
          $replaceRoot: { 
            newRoot: {
              $mergeObjects: [
                '$application',
                { id: '$application._id' }
              ]
            }
          }
        },
        { $project: { _id: 0 } },
        { $sort: { createdAt: -1 } }
      ]).toArray();

      res.json(assignedApps);
    } catch (error) {
      console.error("Get evaluator applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/admin/dashboard", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      
      const [totalStats, activeEvaluators, monthlyChartData, workflowDistribution, avgProcessing] = await Promise.all([
        db.collection('applications').aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              approved: {
                $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
              }
            }
          }
        ]).toArray(),
        db.collection('users').countDocuments({ role: "evaluator" }),
        db.collection('applications').aggregate([
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-01',
                  date: '$createdAt'
                }
              },
              applications: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } },
          { $limit: 12 },
          {
            $project: {
              month: '$_id',
              applications: 1
            }
          }
        ]).toArray(),
        db.collection('applications').aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              status: '$_id',
              count: 1,
              _id: 0
            }
          }
        ]).toArray(),
        db.collection('applications').aggregate([
          {
            $match: {
              status: 'approved',
              submittedAt: { $ne: null },
              updatedAt: { $ne: null }
            }
          },
          {
            $group: {
              _id: null,
              avgDays: {
                $avg: {
                  $divide: [
                    { $subtract: ['$updatedAt', '$submittedAt'] },
                    86400000
                  ]
                }
              }
            }
          }
        ]).toArray()
      ]);

      const totalCount = totalStats[0]?.total || 0;
      const approvedCount = totalStats[0]?.approved || 0;
      const avgDays = Math.round(avgProcessing[0]?.avgDays || 0);

      const stats = {
        totalApplications: totalCount,
        activeEvaluators: activeEvaluators,
        approvalRate: totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0,
        avgProcessingTime: `${avgDays} days`,
      };

      const chartData = monthlyChartData
        .reverse()
        .map(item => {
          const date = new Date(item.month);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear();
          return {
            name: `${monthName} ${year}`,
            applications: item.applications,
          };
        });

      const workflow = workflowDistribution.map(w => ({
        stage: w.status,
        count: w.count,
      }));

      res.json({ stats, chartData, workflowStages: workflow });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard data" });
    }
  });

  app.get("/api/admin/alerts", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const alerts = [];
      
      const unassignedApps = await db.collection('applications').aggregate([
        {
          $match: { status: "under_evaluation" }
        },
        {
          $lookup: {
            from: 'evaluatorAssignments',
            localField: '_id',
            foreignField: 'applicationId',
            as: 'assignments'
          }
        },
        {
          $match: { assignments: { $size: 0 } }
        },
        {
          $count: 'count'
        }
      ]).toArray();

      if (unassignedApps[0]?.count > 0) {
        alerts.push({
          type: "warning",
          message: `${unassignedApps[0].count} applications pending evaluator assignment`,
          action: "Assign Evaluators",
          actionUrl: "/admin/applications"
        });
      }

      const upcomingSiteVisits = await db.collection('evaluatorAssignments').countDocuments({
        deadline: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        completedAt: null
      });

      if (upcomingSiteVisits > 0) {
        alerts.push({
          type: "info",
          message: `${upcomingSiteVisits} site visits scheduled in the next 7 days`,
          action: "View Schedule",
          actionUrl: "/admin/applications"
        });
      }

      const overdueReviews = await db.collection('evaluatorAssignments').countDocuments({
        deadline: { $lt: new Date() },
        completedAt: null
      });

      if (overdueReviews > 0) {
        alerts.push({
          type: "error",
          message: `${overdueReviews} overdue evaluations`,
          action: "View Details",
          actionUrl: "/admin/applications"
        });
      }

      res.json({ alerts });
    } catch (error) {
      console.error("Get alerts error:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/applications", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const validationResult = createApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }

      const { applicationType, institutionName, address, state, courseName, intake, description } = validationResult.data;

      const applicationCount = await db.collection('applications').countDocuments();
      const applicationNumber = `APP${String(applicationCount + 1).padStart(6, '0')}`;

      const application = {
        _id: crypto.randomUUID(),
        applicationNumber,
        institutionId: institution._id,
        applicationType,
        status: "draft" as const,
        institutionName: institutionName || institution.name,
        address: address || institution.address,
        state: state || institution.state,
        courseName,
        intake,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('applications').insertOne(application);

      const { _id, ...rest } = application;
      res.json({ application: { id: _id, ...rest } });
    } catch (error) {
      console.error("Create application error:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.get("/api/applications/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (req.session.userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Forbidden: You can only view your own applications" });
        }
      } else if (req.session.userRole === "evaluator") {
        const assignment = await db.collection('evaluatorAssignments').findOne({
          applicationId: id,
          evaluatorId: req.session.userId
        });

        if (!assignment) {
          return res.status(403).json({ message: "Forbidden: You can only view applications assigned to you" });
        }
      }

      res.json(mapIdField(application));
    } catch (error) {
      console.error("Get application error:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.patch("/api/applications/:id", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const validationResult = updateApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const updateData = validationResult.data;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only update your own applications" });
      }

      const result = await db.collection('applications').findOneAndUpdate(
        { _id: id } as any,
        { $set: { ...updateData, updatedAt: new Date() } } as any,
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updatedApp = result.value;
      res.json({ application: mapIdField(updatedApp) });
    } catch (error) {
      console.error("Update application error:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete("/api/applications/:id", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.status !== "draft") {
        return res.status(400).json({ message: "Only draft applications can be deleted" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own applications" });
      }

      await db.collection('applications').deleteOne({ _id: id });

      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error("Delete application error:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  app.post("/api/applications/:id/submit", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only submit your own applications" });
      }

      if (application.status !== "draft") {
        return res.status(400).json({ message: "Application has already been submitted" });
      }

      const result = await db.collection('applications').findOneAndUpdate(
        { _id: id } as any,
        { 
          $set: { 
            status: "submitted",
            submittedAt: new Date(),
            updatedAt: new Date()
          } 
        } as any,
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updatedApp = result.value;
      res.json({ application: mapIdField(updatedApp) });
    } catch (error) {
      console.error("Submit application error:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  app.patch("/api/applications/:id/status", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const validationResult = updateApplicationStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { status } = validationResult.data;

      const result = await db.collection('applications').findOneAndUpdate(
        { _id: id } as any,
        { $set: { status, updatedAt: new Date() } } as any,
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updatedApp = result.value;
      res.json({ application: mapIdField(updatedApp) });
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  app.get("/api/applications/:id/documents", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (req.session.userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      } else if (req.session.userRole === "evaluator") {
        const assignment = await db.collection('evaluatorAssignments').findOne({
          applicationId: id,
          evaluatorId: req.session.userId
        });

        if (!assignment) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const docs = await db.collection('documents')
        .find({ applicationId: id })
        .sort({ uploadedAt: -1 })
        .toArray();

      res.json({ documents: mapIdFields(docs) });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/applications/:id/documents", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const { category, fileName, fileSize, fileUrl } = req.body;

      if (!category || !fileName || !fileSize || !fileUrl) {
        return res.status(400).json({ message: "All document fields are required" });
      }

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only upload documents to your own applications" });
      }

      const document = {
        _id: crypto.randomUUID(),
        applicationId: id,
        category,
        fileName,
        fileSize,
        fileUrl,
        status: "pending",
        verified: false,
        uploadedAt: new Date(),
      };

      await db.collection('documents').insertOne(document);

      res.json({ document: mapIdField(document) });
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const document = await db.collection('documents').findOne({ _id: id });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const application = await db.collection('applications').findOne({ _id: document.applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only delete documents from your own applications" });
      }

      await db.collection('documents').deleteOne({ _id: id });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.post("/api/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const validationResult = sendMessageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { applicationId, content } = validationResult.data;

      const application = await db.collection('applications').findOne({ _id: applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userRole = req.session.userRole;
      const userId = req.session.userId!;

      if (userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Access denied to send messages for this application" });
        }
      } else if (userRole === "evaluator") {
        const assignment = await db.collection('evaluatorAssignments').findOne({
          applicationId,
          evaluatorId: userId
        });

        if (!assignment) {
          return res.status(403).json({ message: "Access denied to send messages for this application" });
        }
      }

      const message = {
        _id: crypto.randomUUID(),
        applicationId,
        senderId: userId,
        content,
        createdAt: new Date(),
      };

      await db.collection('messages').insertOne(message);

      res.json({ message: mapIdField(message) });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/applications/:applicationId/messages", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { applicationId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const application = await db.collection('applications').findOne({ _id: applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userRole = req.session.userRole;
      const userId = req.session.userId!;

      if (userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Access denied to send messages for this application" });
        }
      } else if (userRole === "evaluator") {
        const assignment = await db.collection('evaluatorAssignments').findOne({
          applicationId,
          evaluatorId: userId
        });

        if (!assignment) {
          return res.status(403).json({ message: "Access denied to send messages for this application" });
        }
      }

      const message = {
        _id: crypto.randomUUID(),
        applicationId,
        senderId: userId,
        content: content.trim(),
        createdAt: new Date(),
      };

      await db.collection('messages').insertOne(message);

      res.json({ message: mapIdField(message) });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/admin/assign-evaluator", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const validationResult = assignEvaluatorSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { applicationId, evaluatorId, priority, deadline } = validationResult.data;

      const assignment = {
        _id: crypto.randomUUID(),
        applicationId,
        evaluatorId,
        priority: priority || "medium" as const,
        deadline: deadline ? new Date(deadline) : undefined,
        assignedAt: new Date(),
      };

      await db.collection('evaluatorAssignments').insertOne(assignment);

      await db.collection('applications').updateOne(
        { _id: applicationId },
        { $set: { status: "under_evaluation", updatedAt: new Date() } }
      );

      res.json({ assignment: mapIdField(assignment) });
    } catch (error) {
      console.error("Assign evaluator error:", error);
      res.status(500).json({ message: "Failed to assign evaluator" });
    }
  });

  app.get("/api/admin/applications", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const allApplications = await db.collection('applications')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.json({ applications: mapIdFields(allApplications) });
    } catch (error) {
      console.error("Get all applications error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/evaluations", requireAuth, requireRole("evaluator"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const validationResult = submitEvaluationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const { assignmentId, applicationId, score, comments, recommendation, siteVisitNotes } = validationResult.data;

      const evaluation = {
        _id: crypto.randomUUID(),
        assignmentId,
        applicationId,
        evaluatorId: req.session.userId!,
        score,
        comments,
        recommendation,
        siteVisitNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('evaluations').insertOne(evaluation);

      await db.collection('evaluatorAssignments').updateOne(
        { _id: assignmentId },
        { $set: { completedAt: new Date() } }
      );

      res.json({ evaluation: mapIdField(evaluation) });
    } catch (error) {
      console.error("Submit evaluation error:", error);
      res.status(500).json({ message: "Failed to submit evaluation" });
    }
  });

  app.get("/api/notifications", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const userNotifications = await db.collection('notifications')
        .find({ userId: req.session.userId })
        .sort({ sentAt: -1 })
        .toArray();

      res.json({ notifications: mapIdFields(userNotifications) });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const result = await db.collection('notifications').findOneAndUpdate(
        { _id: id, userId: req.session.userId } as any,
        { $set: { isRead: true } } as any,
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "Notification not found" });
      }

      const updatedNotification = result.value;
      res.json({ notification: mapIdField(updatedNotification) });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.get("/api/applications/:id/infrastructure-images", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (req.session.userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const images = await db.collection('infrastructureImages')
        .find({ applicationId: id })
        .sort({ uploadDate: -1 })
        .toArray();

      res.json({ images: mapIdFields(images) });
    } catch (error) {
      console.error("Get infrastructure images error:", error);
      res.status(500).json({ message: "Failed to fetch infrastructure images" });
    }
  });

  app.post("/api/applications/:id/infrastructure-images", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const { imageUrl, facilityType, geoCoordinates } = req.body;

      if (!imageUrl || !facilityType) {
        return res.status(400).json({ message: "Image URL and facility type are required" });
      }

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only upload images to your own applications" });
      }

      const image = {
        _id: crypto.randomUUID(),
        applicationId: id,
        imageUrl,
        facilityType,
        geoCoordinates: geoCoordinates || undefined,
        uploadDate: new Date(),
      };

      await db.collection('infrastructureImages').insertOne(image);

      res.json({ image: mapIdField(image) });
    } catch (error) {
      console.error("Upload infrastructure image error:", error);
      res.status(500).json({ message: "Failed to upload infrastructure image" });
    }
  });

  app.delete("/api/infrastructure-images/:id", requireAuth, requireRole("institution"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const image = await db.collection('infrastructureImages').findOne({ _id: id });

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const application = await db.collection('applications').findOne({ _id: image.applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

      if (!institution || institution._id !== application.institutionId) {
        return res.status(403).json({ message: "Forbidden: You can only delete images from your own applications" });
      }

      await db.collection('infrastructureImages').deleteOne({ _id: id });

      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Delete infrastructure image error:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  app.get("/api/infrastructure-images/:id/cv-analysis", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const image = await db.collection('infrastructureImages').findOne({ _id: id });

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const application = await db.collection('applications').findOne({ _id: image.applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (req.session.userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const analysis = await db.collection('cvAnalysis').findOne({ imageId: id });

      if (!analysis) {
        return res.status(404).json({ message: "CV analysis not found" });
      }

      res.json({ analysis: mapIdField(analysis) });
    } catch (error) {
      console.error("Get CV analysis error:", error);
      res.status(500).json({ message: "Failed to fetch CV analysis" });
    }
  });

  app.post("/api/infrastructure-images/:id/cv-analysis", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const { dimensions, detectedFeatures, meetsStandards, accuracyScore, remarks } = req.body;

      const analysis = {
        _id: crypto.randomUUID(),
        imageId: id,
        dimensions: dimensions || undefined,
        detectedFeatures: detectedFeatures || undefined,
        meetsStandards: meetsStandards || undefined,
        accuracyScore: accuracyScore || undefined,
        remarks: remarks || undefined,
        analyzedAt: new Date(),
      };

      await db.collection('cvAnalysis').insertOne(analysis);

      res.json({ analysis: mapIdField(analysis) });
    } catch (error) {
      console.error("Create CV analysis error:", error);
      res.status(500).json({ message: "Failed to create CV analysis" });
    }
  });

  app.get("/api/documents/:id/verification", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const document = await db.collection('documents').findOne({ _id: id });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const application = await db.collection('applications').findOne({ _id: document.applicationId });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (req.session.userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const verification = await db.collection('verificationResults').findOne({ documentId: id });

      if (!verification) {
        return res.status(404).json({ message: "Verification result not found" });
      }

      res.json({ verification: mapIdField(verification) });
    } catch (error) {
      console.error("Get verification result error:", error);
      res.status(500).json({ message: "Failed to fetch verification result" });
    }
  });

  app.post("/api/documents/:id/verification", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const { verificationType, confidenceScore, extractedData, isCompliant, remarks } = req.body;

      if (!verificationType) {
        return res.status(400).json({ message: "Verification type is required" });
      }

      const verification = {
        _id: crypto.randomUUID(),
        documentId: id,
        verificationType,
        confidenceScore: confidenceScore || undefined,
        extractedData: extractedData || undefined,
        isCompliant: isCompliant || undefined,
        remarks: remarks || undefined,
        verifiedAt: new Date(),
      };

      await db.collection('verificationResults').insertOne(verification);

      await db.collection('documents').updateOne(
        { _id: id },
        { $set: { verified: isCompliant || false } }
      );

      res.json({ verification: mapIdField(verification) });
    } catch (error) {
      console.error("Create verification result error:", error);
      res.status(500).json({ message: "Failed to create verification result" });
    }
  });

  app.get("/api/admin/analytics", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { metricType } = req.query;

      let metrics;
      if (metricType) {
        metrics = await db.collection('analyticsMetrics')
          .find({ metricType: metricType as string })
          .sort({ recordDate: -1 })
          .toArray();
      } else {
        metrics = await db.collection('analyticsMetrics')
          .find({})
          .sort({ recordDate: -1 })
          .toArray();
      }

      res.json({ metrics: mapIdFields(metrics) });
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post("/api/admin/analytics", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { metricType, data, value } = req.body;

      if (!metricType) {
        return res.status(400).json({ message: "Metric type is required" });
      }

      const metric = {
        _id: crypto.randomUUID(),
        metricType,
        recordDate: new Date(),
        data: data || undefined,
        value: value || undefined,
      };

      await db.collection('analyticsMetrics').insertOne(metric);

      res.json({ metric: mapIdField(metric) });
    } catch (error) {
      console.error("Create analytics metric error:", error);
      res.status(500).json({ message: "Failed to create analytics metric" });
    }
  });

  app.get("/api/admin/audit-logs", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { entityId, userId } = req.query;

      let logs;
      if (entityId) {
        logs = await db.collection('auditLogs')
          .find({ entityId: entityId as string })
          .sort({ timestamp: -1 })
          .toArray();
      } else if (userId) {
        logs = await db.collection('auditLogs')
          .find({ userId: userId as string })
          .sort({ timestamp: -1 })
          .toArray();
      } else {
        logs = await db.collection('auditLogs')
          .find({})
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray();
      }

      res.json({ logs: mapIdFields(logs) });
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/evaluators", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const allEvaluators = await db.collection('evaluators')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.json({ evaluators: mapIdFields(allEvaluators) });
    } catch (error) {
      console.error("Get evaluators error:", error);
      res.status(500).json({ message: "Failed to fetch evaluators" });
    }
  });

  app.get("/api/evaluators/available", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const availableEvaluators = await db.collection('evaluators')
        .find({ available: true })
        .sort({ currentWorkload: 1 })
        .toArray();

      res.json({ evaluators: mapIdFields(availableEvaluators) });
    } catch (error) {
      console.error("Get available evaluators error:", error);
      res.status(500).json({ message: "Failed to fetch available evaluators" });
    }
  });

  app.post("/api/evaluators", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { userId, expertise, department } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await db.collection('users').findOne({ _id: userId });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== "evaluator") {
        return res.status(400).json({ message: "User must have evaluator role" });
      }

      const existingEvaluator = await db.collection('evaluators').findOne({ userId });

      if (existingEvaluator) {
        return res.status(400).json({ message: "Evaluator profile already exists for this user" });
      }

      const evaluator = {
        _id: crypto.randomUUID(),
        userId,
        expertise: expertise || undefined,
        department: department || undefined,
        currentWorkload: 0,
        avgReviewTime: undefined,
        available: true,
        createdAt: new Date(),
      };

      await db.collection('evaluators').insertOne(evaluator);

      res.json({ evaluator: mapIdField(evaluator) });
    } catch (error) {
      console.error("Create evaluator error:", error);
      res.status(500).json({ message: "Failed to create evaluator" });
    }
  });

  app.patch("/api/evaluators/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;
      const { expertise, department, available, currentWorkload } = req.body;

      const updateData: any = {};
      if (expertise !== undefined) updateData.expertise = expertise;
      if (department !== undefined) updateData.department = department;
      if (available !== undefined) updateData.available = available;
      if (currentWorkload !== undefined) updateData.currentWorkload = currentWorkload;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      const result = await db.collection('evaluators').findOneAndUpdate(
        { _id: id } as any,
        { $set: updateData } as any,
        { returnDocument: 'after' }
      );

      if (!result || !result.value) {
        return res.status(404).json({ message: "Evaluator not found" });
      }

      const updatedEvaluator = result.value;
      res.json({ evaluator: mapIdField(updatedEvaluator) });
    } catch (error) {
      console.error("Update evaluator error:", error);
      res.status(500).json({ message: "Failed to update evaluator" });
    }
  });

  app.get("/api/applications/:id/timeline", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const db = getDB();
      const { id } = req.params;

      const application = await db.collection('applications').findOne({ _id: id });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (req.session.userRole === "institution") {
        const institution = await db.collection('institutions').findOne({ userId: req.session.userId });

        if (!institution || institution._id !== application.institutionId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      } else if (req.session.userRole === "evaluator") {
        const assignment = await db.collection('evaluatorAssignments').findOne({
          applicationId: id,
          evaluatorId: req.session.userId
        });

        if (!assignment) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      const stages = await db.collection('timelineStages')
        .find({ applicationId: id })
        .sort({ createdAt: 1 })
        .toArray();

      res.json({ stages: mapIdFields(stages) });
    } catch (error) {
      console.error("Get timeline error:", error);
      res.status(500).json({ message: "Failed to fetch timeline" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
