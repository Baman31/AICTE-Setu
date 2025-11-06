# Quick Start Guide - AICTE Setu

Get the AICTE Setu application running on localhost in 5 minutes!

## Prerequisites
- Node.js 20+ installed
- MongoDB connection string (see below)

## Quick Setup

### 1. Get MongoDB (Choose One):

**Free Cloud Option:**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create free cluster → Click "Connect" → Choose "Connect your application"
- Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/aicte-setu`

**Local Option:**
- Install MongoDB locally
- Use: `mongodb://localhost:27017/aicte-setu`

### 2. Install & Configure

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` file:
```env
MONGODB_URI=your_mongodb_connection_string_here
SESSION_SECRET=run_this_command_to_generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NODE_ENV=development
PORT=5000
```

### 3. Run

```bash
npm run dev
```

### 4. Login

Open http://localhost:5000 and use:

- **Admin**: admin@aicte.gov.in / password123
- **Evaluator**: evaluator@aicte.gov.in / password123
- **Institution**: iit@institution.edu / password123

That's it! 🎉

---

For detailed setup instructions, see [LOCAL_SETUP.md](./LOCAL_SETUP.md)
