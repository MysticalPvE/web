import { createClient } from "@supabase/supabase-js"

// Get environment variables with fallbacks and validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to your .env.local file.")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please add it to your .env.local file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tracker_progress: {
        Row: {
          id: string
          user_id: string
          subject: string
          topic_key: string
          theory: boolean
          questions: boolean
          revision1: boolean
          revision2: boolean
          revision3: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          topic_key: string
          theory?: boolean
          questions?: boolean
          revision1?: boolean
          revision2?: boolean
          revision3?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          topic_key?: string
          theory?: boolean
          questions?: boolean
          revision1?: boolean
          revision2?: boolean
          revision3?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          link: string | null
          date: string
          doubts: string | null
          subject: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status: string
          link?: string | null
          date: string
          doubts?: string | null
          subject: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: string
          link?: string | null
          date?: string
          doubts?: string | null
          subject?: string
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          datetime: string
          doubts: string | null
          reference_link: string | null
          subject: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status: string
          datetime: string
          doubts?: string | null
          reference_link?: string | null
          subject: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: string
          datetime?: string
          doubts?: string | null
          reference_link?: string | null
          subject?: string
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          total_study_time: number
          session_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_study_time: number
          session_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_study_time?: number
          session_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          subject: string
          messages: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          messages: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          messages?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
