import { supabase, supabaseAdmin } from './supabase'

// Database models/types
export interface Contest {
  id: string
  title: string
  start_time: string
  end_time: string
  disable_copy_paste: boolean
  prevent_tab_switching: boolean
  require_full_screen: boolean
  block_navigation: boolean
  webcam_monitoring: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  contest_id: string
  title: string
  description: string
  input_format: string
  output_format: string
  constraints: string
  sample_input: string
  sample_output: string
  points: number
  created_at: string
  updated_at: string
}

export interface TestCase {
  id: string
  question_id: string
  input: string
  output: string
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  user_id: string
  contest_id: string
  question_id: string
  code: string
  language: string
  status: string
  score: number
  total_tests: number
  passed_tests: number
  runtime?: number
  memory?: number
  submitted_at: string
}

export interface User {
  id: string
  username: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface SecurityViolation {
  id: string
  contest_id: string
  user_id: string
  violation_type: string
  details: Record<string, unknown>
  created_at: string
}

// Database operations
export const db = {
  // Contest operations
  contests: {
    async findMany() {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async findUnique(id: string) {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async create(contest: Omit<Contest, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabaseAdmin
        .from('contests')
        .insert(contest)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: Partial<Contest>) {
      const { data, error } = await supabaseAdmin
        .from('contests')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabaseAdmin
        .from('contests')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Question operations
  questions: {
    async findMany(contestId?: string) {
      let query = supabase.from('questions').select('*')
      
      if (contestId) {
        query = query.eq('contest_id', contestId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    },

    async findUnique(id: string) {
      const { data, error } = await supabase
        .from('questions')
        .select('*, test_cases(*)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async create(question: Omit<Question, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabaseAdmin
        .from('questions')
        .insert(question)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: Partial<Question>) {
      const { data, error } = await supabaseAdmin
        .from('questions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Test case operations
  testCases: {
    async findMany(questionId: string, includeHidden = false) {
      let query = supabase
        .from('test_cases')
        .select('*')
        .eq('question_id', questionId)
      
      if (!includeHidden) {
        query = query.eq('is_hidden', false)
      }
      
      const { data, error } = await query.order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    },

    async create(testCase: Omit<TestCase, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabaseAdmin
        .from('test_cases')
        .insert(testCase)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: Partial<TestCase>) {
      const { data, error } = await supabaseAdmin
        .from('test_cases')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async delete(id: string) {
      const { error } = await supabaseAdmin
        .from('test_cases')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },

  // Submission operations
  submissions: {
    async findMany(options?: {
      contestId?: string
      userId?: string
      questionId?: string
      limit?: number
    }) {
      let query = supabase
        .from('submissions')
        .select('*, users(username, name), questions(title)')
      
      if (options?.contestId) {
        query = query.eq('contest_id', options.contestId)
      }
      if (options?.userId) {
        query = query.eq('user_id', options.userId)
      }
      if (options?.questionId) {
        query = query.eq('question_id', options.questionId)
      }
      
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      
      const { data, error } = await query.order('submitted_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async create(submission: Omit<Submission, 'id' | 'submitted_at'>) {
      const { data, error } = await supabaseAdmin
        .from('submissions')
        .insert(submission)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: Partial<Submission>) {
      const { data, error } = await supabaseAdmin
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // User operations
  users: {
    async findUnique(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async findByUsername(username: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()
      
      if (error) throw error
      return data
    },

    async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(user)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Security violation operations
  securityViolations: {
    async create(violation: Omit<SecurityViolation, 'id' | 'created_at'>) {
      const { data, error } = await supabaseAdmin
        .from('security_violations')
        .insert(violation)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async findMany(contestId?: string, userId?: string) {
      let query = supabase
        .from('security_violations')
        .select('*, users(username, name)')
      
      if (contestId) {
        query = query.eq('contest_id', contestId)
      }
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  }
}
