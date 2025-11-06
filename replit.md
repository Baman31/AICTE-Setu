# AICTE Setu - Digital Approval Platform

## Overview

AICTE Setu is an AI-powered digital transformation platform designed to modernize the All India Council for Technical Education (AICTE) approval process for technical education institutions across India. The platform facilitates the complete lifecycle of institutional approvals—from application submission through document verification, evaluation, site visits, and final approval decisions.

The system serves multiple stakeholder types including educational institutions, evaluators, AICTE administrators, and scrutiny committee members, each with role-specific dashboards and workflows. The platform aims to significantly reduce processing time, automate compliance checking through AI, and ensure transparency throughout the approval process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack React Query for server state management and data synchronization

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Material Design 3 principles for enterprise-grade information hierarchy
- Tailwind CSS for utility-first styling with custom design tokens
- Custom CSS variables for theming (light/dark mode support)
- Responsive grid layouts (12-column system) with mobile-first breakpoints

**Design System:**
- Typography: Roboto font family with hierarchical scale (H1-H4, body, small)
- Spacing: 8px-based spacing system (Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24)
- Color system: HSL-based with semantic tokens for backgrounds, borders, and interactive states
- Border radius: Consistent values (9px large, 6px medium, 3px small)

**Key Frontend Features:**
- Role-based dashboard routing (Institution, Evaluator, Admin)
- Real-time application status tracking with timeline visualization
- Document upload with drag-and-drop support
- Messaging system for stakeholder communication
- Settings management with profile and password updates

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for the API layer
- HTTP server with WebSocket support via Vite's HMR
- Session-based authentication using express-session with MemoryStore
- Bcrypt for password hashing

**API Design:**
- RESTful endpoints organized by user role (`/api/auth`, `/api/institution`, `/api/evaluator`, `/api/admin`)
- Middleware-based authentication using session validation
- Request/response logging for debugging and monitoring
- JSON-based request/response format with Zod schema validation

**Authentication & Authorization:**
- Session-based authentication with HTTP-only cookies
- Role-based access control (institution, evaluator, admin)
- Session management with configurable expiry (24 hours default)
- Environment-based session secret configuration

**Database Layer:**
- MongoDB as the primary NoSQL database
- MongoDB native driver for database operations
- Schema validation using Zod
- String-based UUIDs for document IDs
- Auto-seeding in development mode (disabled in production for security)
- Requires MONGODB_URI environment variable

**Development Database Setup:**
- The database automatically seeds with test data on first run in development mode
- Auto-seeding is DISABLED in production (NODE_ENV=production) for security
- Test credentials for development:
  - Admin: admin@aicte.gov.in / password123
  - Evaluator: evaluator@aicte.gov.in / password123
  - Institution: iit@institution.edu / password123
- Seed includes sample applications, documents, messages, and timeline stages

**Data Models:**
- Users: Email-based authentication with role assignment
- Institutions: Institution profile linked to user accounts
- Applications: Multi-stage approval workflow tracking
- Documents: File metadata and upload management
- Evaluator Assignments: Expert allocation to applications
- Evaluations: Assessment records and ratings
- Messages: Communication threads per application
- Timeline Stages: Workflow progression tracking

### Database Schema Design

**Core Entities:**
- `users`: Authentication and role management (institution, evaluator, admin)
- `institutions`: Institution profile information linked to users
- `applications`: Application records with status tracking, type classification, and metadata
- `documents`: Document metadata with category classification
- `evaluatorAssignments`: Many-to-many relationship between evaluators and applications
- `evaluations`: Evaluation results with ratings and recommendations
- `messages`: Threaded communication system per application
- `timelineStages`: Application workflow stages with completion tracking

**Enums:**
- `user_role`: Role-based access levels
- `application_status`: 11-state workflow (draft → submitted → scrutiny → evaluation → approved/rejected)
- `application_type`: Classification (new-institution, intake-increase, new-course, eoa, location-change)
- `priority`: Task prioritization (low, medium, high)
- `stage_status`: Timeline stage states (pending, current, completed)

**Relationships:**
- Users → Institutions (one-to-one)
- Institutions → Applications (one-to-many)
- Applications → Documents (one-to-many)
- Applications → Timeline Stages (one-to-many)
- Applications → Messages (one-to-many)
- Applications ↔ Evaluators (many-to-many through evaluatorAssignments)
- Applications → Evaluations (one-to-many)

### External Dependencies

**UI Components:**
- Radix UI: Headless component primitives (@radix-ui/react-*)
- shadcn/ui: Pre-built component library with customization
- Lucide React: Icon system
- cmdk: Command palette component
- Recharts: Data visualization for analytics dashboards
- react-day-picker: Calendar and date selection

**Form Management:**
- React Hook Form: Form state and validation
- @hookform/resolvers: Zod integration for schema validation

**Database:**
- mongodb: MongoDB native driver for Node.js
- Zod: Runtime type validation and schema definitions

**Authentication:**
- bcrypt: Password hashing
- express-session: Session management
- memorystore: In-memory session store (development)

**Utilities:**
- date-fns: Date formatting and manipulation
- zod: Runtime type validation
- zod-validation-error: User-friendly validation error messages
- clsx & tailwind-merge: Conditional class name management
- class-variance-authority: Component variant management

**Development Tools:**
- @replit/vite-plugin-*: Replit-specific development enhancements
- tsx: TypeScript execution for development server
- esbuild: Production build for server code

**Infrastructure Considerations:**
- Session store uses MemoryStore (not suitable for production at scale)
- MongoDB connection via native driver
- Environment variable configuration for MONGODB_URI and SESSION_SECRET
- Database indexes created automatically on application startup
- Collections: users, institutions, applications, documents, evaluatorAssignments, evaluations, messages, timelineStages, notifications, auditLogs, analyticsMetrics, infrastructureImages, cvAnalysis, verificationResults, evaluators