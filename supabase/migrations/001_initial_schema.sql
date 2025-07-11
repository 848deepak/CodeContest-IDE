-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Contests table with security settings
CREATE TABLE IF NOT EXISTS contests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    disable_copy_paste BOOLEAN DEFAULT FALSE,
    prevent_tab_switching BOOLEAN DEFAULT FALSE,
    require_full_screen BOOLEAN DEFAULT FALSE,
    block_navigation BOOLEAN DEFAULT FALSE,
    webcam_monitoring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    constraints TEXT NOT NULL,
    sample_input TEXT NOT NULL,
    sample_output TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    contest_id UUID NOT NULL REFERENCES contests(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    score INTEGER DEFAULT 0,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    runtime FLOAT,
    memory FLOAT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id),
    user_id UUID NOT NULL REFERENCES users(id),
    username VARCHAR(255) NOT NULL,
    total_score INTEGER DEFAULT 0,
    last_submission_time TIMESTAMP WITH TIME ZONE,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

-- Create Discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_sticky BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Security Violations table
CREATE TABLE IF NOT EXISTS security_violations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id),
    user_id UUID NOT NULL REFERENCES users(id),
    violation_type VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_contest_user ON submissions(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question_user ON submissions(question_id, user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_contest_score ON leaderboard(contest_id, total_score, last_submission_time);
CREATE INDEX IF NOT EXISTS idx_discussions_contest_created ON discussions(contest_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_discussion_created ON comments(discussion_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_violations_contest_user ON security_violations(contest_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your needs)
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Contests are publicly readable
CREATE POLICY "Contests are publicly readable" ON contests FOR SELECT TO authenticated USING (true);

-- Questions are readable for contest participants
CREATE POLICY "Questions are readable for participants" ON questions FOR SELECT TO authenticated USING (true);

-- Test cases have restricted access (hidden test cases)
CREATE POLICY "Public test cases are readable" ON test_cases FOR SELECT TO authenticated USING (NOT is_hidden);

-- Submissions are readable by the author
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard is publicly readable
CREATE POLICY "Leaderboard is publicly readable" ON leaderboard FOR SELECT TO authenticated USING (true);

-- Discussions and comments are publicly readable
CREATE POLICY "Discussions are publicly readable" ON discussions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create discussions" ON discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security violations are only accessible by admins (you'll need to implement admin role)
CREATE POLICY "Security violations admin only" ON security_violations FOR ALL TO authenticated USING (false);
