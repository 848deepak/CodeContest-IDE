# IDE Web Application

A modern online IDE with contest management system built with Next.js and Supabase.

## Features

- **Multi-language Code Editor**: Monaco Editor with syntax highlighting
- **Contest System**: Create and manage coding contests
- **User Management**: Authentication and user profiles
- **Admin Dashboard**: Manage contests, users, and submissions
- **Judge System**: Code execution and validation
- **Database**: Full contest and user data management

## Quick Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Build and Deploy
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### 3. Set Environment Variables in Vercel Dashboard

```env
DATABASE_URL=your_supabase_connection_string
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
```

### 4. Database Setup
```bash
# Push database schema
npx prisma db push

# Seed initial data
npx prisma db seed
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL="your_supabase_connection_string"
NEXTAUTH_SECRET="your_secret_key"
NEXTAUTH_URL="http://localhost:3000"
```

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Editor**: Monaco Editor
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

---

Ready to deploy! Just run `vercel --prod` and your IDE will be live.
