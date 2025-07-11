-- Supabase Database Schema for Coding Contest IDE
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Contests table with security features
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    disable_copy_paste BOOLEAN DEFAULT false,
    prevent_tab_switching BOOLEAN DEFAULT false,
    require_full_screen BOOLEAN DEFAULT false,
    block_navigation BOOLEAN DEFAULT false,
    webcam_monitoring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    constraints TEXT NOT NULL,
    sample_input TEXT NOT NULL,
    sample_output TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Test Cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    contest_id UUID NOT NULL REFERENCES contests(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT NOT NULL, -- PENDING, ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, etc.
    score INTEGER DEFAULT 0,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    runtime DECIMAL,
    memory DECIMAL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id),
    user_id UUID NOT NULL REFERENCES users(id),
    username TEXT NOT NULL,
    total_score INTEGER DEFAULT 0,
    last_submission_time TIMESTAMP WITH TIME ZONE,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(contest_id, user_id)
);

-- Create Discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_sticky BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Security Violations table
CREATE TABLE IF NOT EXISTS security_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    contest_id UUID NOT NULL REFERENCES contests(id),
    type TEXT NOT NULL, -- 'copy_paste', 'tab_switch', 'navigation', 'fullscreen_exit', etc.
    details TEXT,
    evidence TEXT, -- Could store screenshots, timestamps, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_contest_user ON submissions(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question_user ON submissions(question_id, user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_contest_score ON leaderboard(contest_id, total_score DESC, last_submission_time ASC);
CREATE INDEX IF NOT EXISTS idx_discussions_contest_created ON discussions(contest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_discussion_created ON comments(discussion_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_security_violations_contest_user ON security_violations(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_timestamp ON security_violations(timestamp DESC);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - you can customize these)
-- Allow users to read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Allow reading public contest data
CREATE POLICY "Anyone can view contests" ON contests FOR SELECT USING (true);
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);

-- Allow users to view non-hidden test cases
CREATE POLICY "Anyone can view non-hidden test cases" ON test_cases 
    FOR SELECT USING (is_hidden = false);

-- Allow users to create their own submissions
CREATE POLICY "Users can create submissions" ON submissions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view submissions" ON submissions 
    FOR SELECT USING (true);

-- Allow reading leaderboard
CREATE POLICY "Anyone can view leaderboard" ON leaderboard FOR SELECT USING (true);

-- Allow reading discussions and comments
CREATE POLICY "Anyone can view discussions" ON discussions FOR SELECT USING (true);
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);

-- Allow users to create discussions and comments
CREATE POLICY "Users can create discussions" ON discussions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create comments" ON comments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security violations can be viewed by admins (you'll need to implement admin role)
CREATE POLICY "Anyone can create security violations" ON security_violations 
    FOR INSERT WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON test_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
