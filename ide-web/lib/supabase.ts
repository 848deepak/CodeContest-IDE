import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations (with service role key)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database utility functions
export const db = {
  // Contest operations
  contests: {
    async getAll() {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          questions (
            *,
            test_cases (*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(contest: {
      title: string;
      start_time: string;
      end_time: string;
      disable_copy_paste?: boolean;
      prevent_tab_switching?: boolean;
      require_full_screen?: boolean;
      block_navigation?: boolean;
      webcam_monitoring?: boolean;
    }) {
      const { data, error } = await supabase
        .from('contests')
        .insert(contest)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Record<string, unknown>) {
      const { data, error } = await supabase
        .from('contests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Question operations
  questions: {
    async getByContestId(contestId: string) {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          test_cases (*)
        `)
        .eq('contest_id', contestId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          test_cases (*),
          contest (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(question: {
      contest_id: string;
      title: string;
      description: string;
      input_format: string;
      output_format: string;
      constraints: string;
      sample_input: string;
      sample_output: string;
      points: number;
    }) {
      const { data, error } = await supabase
        .from('questions')
        .insert(question)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Record<string, unknown>) {
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    }
  },

  // Submission operations
  submissions: {
    async create(submission: {
      user_id: string;
      contest_id: string;
      question_id: string;
      code: string;
      language: string;
      status: string;
      score?: number;
      total_tests?: number;
      passed_tests?: number;
      runtime?: number;
      memory?: number;
    }) {
      const { data, error } = await supabase
        .from('submissions')
        .insert(submission)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByContestId(contestId: string) {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          users (username, name),
          questions (title)
        `)
        .eq('contest_id', contestId)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Record<string, unknown>) {
      const { data, error } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Security violations
  securityViolations: {
    async create(violation: {
      user_id: string;
      contest_id: string;
      type: string;
      details?: string;
      evidence?: string;
    }) {
      const { data, error } = await supabase
        .from('security_violations')
        .insert(violation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async getByContestId(contestId: string) {
      const { data, error } = await supabase
        .from('security_violations')
        .select(`
          *,
          users (username, name)
        `)
        .eq('contest_id', contestId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  }
};

export default db;