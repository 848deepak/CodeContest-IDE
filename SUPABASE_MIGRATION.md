# Migrating to Supabase

## Steps to migrate from Prisma + PostgreSQL to Supabase:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Create a new project
4. Choose a name, password, and region
5. Wait for the project to be created

### 2. Get Your Supabase Credentials
From your Supabase project dashboard:
1. Go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service role (secret) key

### 3. Update Environment Variables
Add these to your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Database Migrations
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the SQL script to create all tables and policies

### 5. Update Your Code
The migration is designed to be drop-in compatible. Most of your existing code should work with minimal changes:

- Replace `import { prisma } from '@/lib/prisma'` with `import { db } from '@/lib/database'`
- Replace Prisma queries with the equivalent db methods
- Update authentication to use Supabase Auth (optional)

### 6. Authentication (Optional)
Supabase provides built-in authentication. If you want to use it:

1. Enable authentication providers in Supabase Dashboard > Authentication > Providers
2. Update your auth logic to use Supabase Auth
3. Implement Row Level Security policies for better security

### 7. Test the Migration
1. Start your development server: `npm run dev`
2. Test all CRUD operations
3. Verify security features work correctly
4. Test contest functionality

### 8. Deploy
Once everything is working:
1. Update your production environment variables
2. Deploy to your hosting platform (Vercel, Netlify, etc.)

## Benefits of Supabase:
- Built-in authentication and authorization
- Real-time subscriptions
- Row Level Security
- Auto-generated APIs
- Built-in storage for files
- Edge functions
- Better scalability
- Managed PostgreSQL database

## Example API Route Update:

### Before (Prisma):
```typescript
const contests = await prisma.contest.findMany()
```

### After (Supabase):
```typescript
const contests = await db.contests.findMany()
```

The database adapter handles the conversion between Supabase and your existing code structure.
