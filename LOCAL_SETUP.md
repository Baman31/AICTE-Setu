# AICTE Setu - Local Development Setup Guide

This guide will help you run the AICTE Setu application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (version 20 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (to clone the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

## Step-by-Step Setup

### Step 1: Get MongoDB Connection String

You need a MongoDB database. Choose one of these options:

**Option A: MongoDB Atlas (Free Cloud Database - Recommended)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (choose the free tier)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
7. Replace `<password>` with your actual database password
8. Add a database name at the end (e.g., `/aicte-setu`)

**Option B: Local MongoDB Installation**

1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and start MongoDB on your machine
3. Your connection string will be: `mongodb://localhost:27017/aicte-setu`

### Step 2: Clone the Repository

```bash
# If you're downloading from Replit, download and extract the project
# Or if you have it in Git, clone it:
git clone <your-repository-url>
cd <project-folder>
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 4: Create Environment Variables File

1. Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

2. Open the `.env` file in a text editor and fill in the values:

```env
# Add your MongoDB connection string from Step 1
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/aicte-setu

# Generate a random secret key (run the command below to generate one)
SESSION_SECRET=your_generated_secret_key_here

# Keep as development
NODE_ENV=development

# Default port
PORT=5000
```

**To generate a SESSION_SECRET**, run this command:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as your SESSION_SECRET value.

### Step 5: Start the Development Server

```bash
npm run dev
```

You should see output like:
```
Connected to MongoDB
📦 Development mode: Database is empty, seeding with test data...
✅ Database seeded successfully!

=== TEST CREDENTIALS ===
👤 Admin: admin@aicte.gov.in / password123
👨‍🏫 Evaluator: evaluator@aicte.gov.in / password123
🏛️ Institution: iit@institution.edu / password123
========================

serving on port 5000
```

### Step 6: Access the Application

Open your web browser and go to:
```
http://localhost:5000
```

You should see the AICTE Setu login page!

## Test Credentials

Use these credentials to log in and test the application:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aicte.gov.in | password123 |
| Evaluator | evaluator@aicte.gov.in | password123 |
| Institution | iit@institution.edu | password123 |

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run check` - TypeScript type checking

## Project Structure

```
aicte-setu/
├── client/              # Frontend React application
│   └── src/
│       ├── pages/       # Page components
│       ├── components/  # Reusable UI components
│       └── lib/         # Utilities and helpers
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── db.ts            # MongoDB connection & seeding
│   └── storage.ts       # Storage interface
├── shared/              # Shared types and schemas
│   └── schema.ts        # Zod schemas and types
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables (create this)
```

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, change the `PORT` in your `.env` file to a different port (e.g., 3000, 8080).

### MongoDB Connection Error
- Double-check your `MONGODB_URI` in the `.env` file
- Make sure your IP address is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for development)
- Verify your database password is correct

### Dependencies Not Installing
- Try deleting `node_modules` folder and `package-lock.json`
- Run `npm install` again

### Database Not Seeding
- The database only seeds automatically when:
  - `NODE_ENV=development` in your `.env` file
  - The database is empty (no users exist)
- To re-seed, delete all documents from your MongoDB database and restart

## Development Tips

1. **Hot Reload**: The development server automatically reloads when you make changes to the code

2. **Database Changes**: If you modify the database structure, you may need to clear your MongoDB database and restart to re-seed

3. **TypeScript**: Run `npm run check` to verify there are no TypeScript errors before deploying

## Building for Production

When you're ready to deploy:

1. Set `NODE_ENV=production` in your environment
2. Generate a strong `SESSION_SECRET`
3. Run `npm run build` to create production build
4. Run `npm start` to serve the production version

**Note**: Auto-seeding is disabled in production for security. You'll need to manually create admin accounts.

## Getting Help

If you encounter any issues:
1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is accessible
4. Check that all dependencies are installed

## Next Steps

Now that your local environment is set up:
- Explore the different user dashboards (Admin, Evaluator, Institution)
- Test the application workflow
- Start customizing and developing new features!

Happy coding! 🚀
