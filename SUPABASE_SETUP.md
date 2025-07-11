# Supabase Setup Guide for Coding Contest IDE

## 1. Database Schema Setup

1. **Go to your Supabase dashboard**: https://app.supabase.com/project/qztzlyrozaztorpbwpqd
2. **Click on "SQL Editor"** in the left sidebar
3. **Copy and paste the entire content** from `supabase/schema.sql` into the SQL editor
4. **Click "Run"** to execute the schema

This will create all the necessary tables, indexes, and Row Level Security policies.

## 2. Get Service Role Key (Optional but Recommended)

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the **service_role** key (this key bypasses RLS for admin operations)
3. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## 3. Testing the Setup

After running the schema, you can test your database by:

1. Going to **Table Editor** in Supabase dashboard
2. You should see all the tables: `contests`, `questions`, `test_cases`, `submissions`, etc.
3. Try inserting some test data

## 4. Migration from Prisma to Supabase

The project is now set up to use both Prisma and Supabase. To fully migrate:

1. **Update API routes** to use `db` from `lib/supabase.ts` instead of `prisma`
2. **Replace Prisma imports** with Supabase imports
3. **Update data models** to match Supabase naming conventions (snake_case)

## 5. Benefits of Supabase

✅ **No complex migrations** - Just run SQL directly
✅ **Real-time subscriptions** - Get live updates
✅ **Built-in authentication** - If you want to add auth later
✅ **Row Level Security** - Built-in security policies
✅ **Auto-generated APIs** - REST and GraphQL APIs
✅ **Dashboard** - Easy database management

## 6. Usage Example

```typescript
import { db } from '@/lib/supabase';

// Create a contest
const contest = await db.contests.create({
  title: "My Contest",
  start_time: "2025-01-10T10:00:00Z",
  end_time: "2025-01-10T14:00:00Z",
  require_full_screen: true,
  disable_copy_paste: true
});

// Get all contests
const contests = await db.contests.getAll();

// Create a security violation
await db.securityViolations.create({
  user_id: "user-uuid",
  contest_id: "contest-uuid", 
  type: "copy_paste",
  details: "User attempted to copy code"
});
```

## 7. Next Steps

1. Run the schema in Supabase SQL Editor
2. Test the build: `npm run build`
3. Start migrating API routes one by one from Prisma to Supabase
4. Update your components to use the new data structure

Your Supabase setup is ready! 🚀
