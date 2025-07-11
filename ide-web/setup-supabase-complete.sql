-- Complete Supabase Setup Script
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Add any missing indexes (Prisma may not have created all of them)
CREATE INDEX IF NOT EXISTS idx_submissions_contest_user ON "Submission"("contestId", "userId");
CREATE INDEX IF NOT EXISTS idx_submissions_question_user ON "Submission"("questionId", "userId");
CREATE INDEX IF NOT EXISTS idx_discussions_contest_created ON "Discussion"("contestId", "createdAt" DESC);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Discussion" ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these later)
-- Allow reading public contest data
CREATE POLICY "Anyone can view contests" ON "Contest" FOR SELECT USING (true);
CREATE POLICY "Anyone can view questions" ON "Question" FOR SELECT USING (true);

-- Allow users to view non-hidden test cases
CREATE POLICY "Anyone can view non-hidden test cases" ON "TestCase" 
    FOR SELECT USING ("isHidden" = false);

-- Allow reading submissions
CREATE POLICY "Anyone can view submissions" ON "Submission" 
    FOR SELECT USING (true);

-- Allow reading discussions
CREATE POLICY "Anyone can view discussions" ON "Discussion" FOR SELECT USING (true);

-- Insert sample contest data
INSERT INTO "Contest" (id, title, "startTime", "endTime") VALUES 
(
    gen_random_uuid(),
    'Sample Programming Contest',
    '2025-01-15 10:00:00+00',
    '2025-01-15 13:00:00+00'
) ON CONFLICT DO NOTHING;

-- Get the contest ID for the sample data
DO $$ 
DECLARE 
    contest_id UUID;
    question_id UUID;
BEGIN
    -- Get or create a sample contest
    SELECT id INTO contest_id FROM "Contest" WHERE title = 'Sample Programming Contest' LIMIT 1;
    
    IF contest_id IS NOT NULL THEN
        -- Insert a sample question
        INSERT INTO "Question" (
            id, "contestId", title, description, "inputFormat", "outputFormat", 
            constraints, "sampleInput", "sampleOutput", points
        ) VALUES (
            gen_random_uuid(),
            contest_id,
            'Two Sum Problem',
            'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            'First line contains n (size of array)\nSecond line contains n integers\nThird line contains target integer',
            'Two integers representing the indices (0-based)',
            '2 ≤ n ≤ 1000\n-1000 ≤ nums[i] ≤ 1000\n-2000 ≤ target ≤ 2000',
            E'4\n2 7 11 15\n9',
            '0 1',
            100
        ) ON CONFLICT DO NOTHING
        RETURNING id INTO question_id;
        
        -- Insert sample test cases
        IF question_id IS NOT NULL THEN
            INSERT INTO "TestCase" ("questionId", input, output, "isHidden") VALUES
            (question_id, E'4\n2 7 11 15\n9', '0 1', false),
            (question_id, E'3\n3 2 4\n6', '1 2', true),
            (question_id, E'2\n3 3\n6', '0 1', true)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- Success message
SELECT 'Supabase database setup completed successfully!' as message;
