export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          short_description: string
          category_id: string | null
          creator_id: string | null
          live_url: string
          github_url: string | null
          demo_video_url: string | null
          story_problem: string
          story_idea: string
          story_ai_process: string
          story_surprises: string | null
          ai_tools_used: string[]
          build_time_hours: number | null
          key_prompts: string | null
          hero_image_url: string
          screenshot_urls: string[] | null
          status: 'pending' | 'approved' | 'rejected' | 'archived'
          featured: boolean
          submission_date: string
          approval_date: string | null
          view_count: number
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          short_description: string
          category_id?: string | null
          creator_id?: string | null
          live_url: string
          github_url?: string | null
          demo_video_url?: string | null
          story_problem: string
          story_idea: string
          story_ai_process: string
          story_surprises?: string | null
          ai_tools_used: string[]
          build_time_hours?: number | null
          key_prompts?: string | null
          hero_image_url: string
          screenshot_urls?: string[] | null
          status?: 'pending' | 'approved' | 'rejected' | 'archived'
          featured?: boolean
          submission_date?: string
          approval_date?: string | null
          view_count?: number
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          short_description?: string
          category_id?: string | null
          creator_id?: string | null
          live_url?: string
          github_url?: string | null
          demo_video_url?: string | null
          story_problem?: string
          story_idea?: string
          story_ai_process?: string
          story_surprises?: string | null
          ai_tools_used?: string[]
          build_time_hours?: number | null
          key_prompts?: string | null
          hero_image_url?: string
          screenshot_urls?: string[] | null
          status?: 'pending' | 'approved' | 'rejected' | 'archived'
          featured?: boolean
          submission_date?: string
          approval_date?: string | null
          view_count?: number
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'creator' | 'reviewer' | 'admin'
          bio: string | null
          avatar_url: string | null
          website_url: string | null
          twitter_handle: string | null
          linkedin_url: string | null
          github_username: string | null
          projects_count: number
          total_views: number
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'creator' | 'reviewer' | 'admin'
          bio?: string | null
          avatar_url?: string | null
          website_url?: string | null
          twitter_handle?: string | null
          linkedin_url?: string | null
          github_username?: string | null
          projects_count?: number
          total_views?: number
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'creator' | 'reviewer' | 'admin'
          bio?: string | null
          avatar_url?: string | null
          website_url?: string | null
          twitter_handle?: string | null
          linkedin_url?: string | null
          github_username?: string | null
          projects_count?: number
          total_views?: number
          created_at?: string
          last_login?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          display_order?: number
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          project_id: string
          reviewer_id: string
          decision: 'approve' | 'reject' | 'request_changes'
          feedback: string | null
          originality_score: number | null
          execution_score: number | null
          story_score: number | null
          ai_integration_score: number | null
          reviewed_at: string
        }
        Insert: {
          id?: string
          project_id: string
          reviewer_id: string
          decision: 'approve' | 'reject' | 'request_changes'
          feedback?: string | null
          originality_score?: number | null
          execution_score?: number | null
          story_score?: number | null
          ai_integration_score?: number | null
          reviewed_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          reviewer_id?: string
          decision?: 'approve' | 'reject' | 'request_changes'
          feedback?: string | null
          originality_score?: number | null
          execution_score?: number | null
          story_score?: number | null
          ai_integration_score?: number | null
          reviewed_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: string | null
          created_at?: string
        }
      }
      project_tags: {
        Row: {
          project_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          project_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          project_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      favorites: {
        Row: {
          user_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          project_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
