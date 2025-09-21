export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          conditions: Json
          created_at: string
          description: string
          icon: string
          id: string
          rarity: Database["public"]["Enums"]["achievement_rarity"]
          title: string
          unlocked_at: string | null
          user_id: string
          xp_reward: number
        }
        Insert: {
          conditions: Json
          created_at?: string
          description: string
          icon: string
          id?: string
          rarity: Database["public"]["Enums"]["achievement_rarity"]
          title: string
          unlocked_at?: string | null
          user_id: string
          xp_reward?: number
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string
          icon?: string
          id?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          title?: string
          unlocked_at?: string | null
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      day_plan_slots: {
        Row: {
          created_at: string
          date: string
          id: string
          locked: boolean | null
          slot_end: string
          slot_start: string
          subtask_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          locked?: boolean | null
          slot_end: string
          slot_start: string
          subtask_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          locked?: boolean | null
          slot_end?: string
          slot_start?: string
          subtask_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_plan_slots_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "subtasks"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          branch: Database["public"]["Enums"]["node_branch"]
          category: Database["public"]["Enums"]["node_category"]
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          domain: string | null
          est_total_minutes: number | null
          goal_type: string | null
          id: string
          mastered_at: string | null
          metadata: Json | null
          parent_id: string | null
          position_x: number
          position_y: number
          prerequisites: string[] | null
          progress: number
          reward_skills: string[] | null
          reward_xp: number
          status: Database["public"]["Enums"]["node_status"]
          time_spent: number
          title: string
          type: Database["public"]["Enums"]["node_type"]
          unlocks: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch: Database["public"]["Enums"]["node_branch"]
          category: Database["public"]["Enums"]["node_category"]
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          domain?: string | null
          est_total_minutes?: number | null
          goal_type?: string | null
          id?: string
          mastered_at?: string | null
          metadata?: Json | null
          parent_id?: string | null
          position_x?: number
          position_y?: number
          prerequisites?: string[] | null
          progress?: number
          reward_skills?: string[] | null
          reward_xp?: number
          status?: Database["public"]["Enums"]["node_status"]
          time_spent?: number
          title: string
          type: Database["public"]["Enums"]["node_type"]
          unlocks?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch?: Database["public"]["Enums"]["node_branch"]
          category?: Database["public"]["Enums"]["node_category"]
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          domain?: string | null
          est_total_minutes?: number | null
          goal_type?: string | null
          id?: string
          mastered_at?: string | null
          metadata?: Json | null
          parent_id?: string | null
          position_x?: number
          position_y?: number
          prerequisites?: string[] | null
          progress?: number
          reward_skills?: string[] | null
          reward_xp?: number
          status?: Database["public"]["Enums"]["node_status"]
          time_spent?: number
          title?: string
          type?: Database["public"]["Enums"]["node_type"]
          unlocks?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consistency_pillar: number
          created_at: string
          current_streak: number
          current_xp: number
          focus_pillar: number
          id: string
          last_active_at: string
          last_completion_date: string | null
          level: number
          longest_streak: number
          name: string
          rank: string
          resilience_pillar: number
          total_xp: number
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          consistency_pillar?: number
          created_at?: string
          current_streak?: number
          current_xp?: number
          focus_pillar?: number
          id?: string
          last_active_at?: string
          last_completion_date?: string | null
          level?: number
          longest_streak?: number
          name?: string
          rank?: string
          resilience_pillar?: number
          total_xp?: number
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          consistency_pillar?: number
          created_at?: string
          current_streak?: number
          current_xp?: number
          focus_pillar?: number
          id?: string
          last_active_at?: string
          last_completion_date?: string | null
          level?: number
          longest_streak?: number
          name?: string
          rank?: string
          resilience_pillar?: number
          total_xp?: number
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: []
      }
      reflections: {
        Row: {
          bonus_xp: number
          created_at: string
          focus_insights: string | null
          id: string
          next_suggestions: string[] | null
          reflection: string
          session_id: string | null
          task_id: string | null
          user_id: string
          xp_breakdown: Json | null
        }
        Insert: {
          bonus_xp?: number
          created_at?: string
          focus_insights?: string | null
          id?: string
          next_suggestions?: string[] | null
          reflection: string
          session_id?: string | null
          task_id?: string | null
          user_id: string
          xp_breakdown?: Json | null
        }
        Update: {
          bonus_xp?: number
          created_at?: string
          focus_insights?: string | null
          id?: string
          next_suggestions?: string[] | null
          reflection?: string
          session_id?: string | null
          task_id?: string | null
          user_id?: string
          xp_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          analysis: Json | null
          category: Database["public"]["Enums"]["task_category"]
          created_at: string
          duration: number
          end_time: string | null
          focus_score: number
          id: string
          node_id: string | null
          notes: string | null
          start_time: string
          task_id: string | null
          type: Database["public"]["Enums"]["session_type"]
          user_id: string
          xp_earned: number
        }
        Insert: {
          analysis?: Json | null
          category: Database["public"]["Enums"]["task_category"]
          created_at?: string
          duration?: number
          end_time?: string | null
          focus_score?: number
          id?: string
          node_id?: string | null
          notes?: string | null
          start_time: string
          task_id?: string | null
          type?: Database["public"]["Enums"]["session_type"]
          user_id: string
          xp_earned?: number
        }
        Update: {
          analysis?: Json | null
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          duration?: number
          end_time?: string | null
          focus_score?: number
          id?: string
          node_id?: string | null
          notes?: string | null
          start_time?: string
          task_id?: string | null
          type?: Database["public"]["Enums"]["session_type"]
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          daily_xp_goal: number
          dungeon_bonus: boolean
          efficiency_slope: number
          id: string
          idle_timeout: number
          min_focus_minutes: number
          reminder_time: string
          sound_enabled: boolean
          streak_cap: number
          theme: string
          updated_at: string
          user_id: string
          work_session_length: number
        }
        Insert: {
          created_at?: string
          daily_xp_goal?: number
          dungeon_bonus?: boolean
          efficiency_slope?: number
          id?: string
          idle_timeout?: number
          min_focus_minutes?: number
          reminder_time?: string
          sound_enabled?: boolean
          streak_cap?: number
          theme?: string
          updated_at?: string
          user_id: string
          work_session_length?: number
        }
        Update: {
          created_at?: string
          daily_xp_goal?: number
          dungeon_bonus?: boolean
          efficiency_slope?: number
          id?: string
          idle_timeout?: number
          min_focus_minutes?: number
          reminder_time?: string
          sound_enabled?: boolean
          streak_cap?: number
          theme?: string
          updated_at?: string
          user_id?: string
          work_session_length?: number
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          created_at: string
          earliest_start: string | null
          est_minutes: number
          hard_window: unknown | null
          id: string
          seq: number | null
          status: string
          tags: string[] | null
          task_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          earliest_start?: string | null
          est_minutes?: number
          hard_window?: unknown | null
          id?: string
          seq?: number | null
          status?: string
          tags?: string[] | null
          task_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          earliest_start?: string | null
          est_minutes?: number
          hard_window?: unknown | null
          id?: string
          seq?: number | null
          status?: string
          tags?: string[] | null
          task_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_time: number | null
          category: Database["public"]["Enums"]["task_category"]
          completed_at: string | null
          context: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_date: string | null
          energy: string | null
          estimated_time: number
          id: string
          node_id: string | null
          priority: number
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          value_score: number | null
          xp_reward: number
        }
        Insert: {
          actual_time?: number | null
          category: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          difficulty: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          energy?: string | null
          estimated_time?: number
          id?: string
          node_id?: string | null
          priority?: number
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          value_score?: number | null
          xp_reward?: number
        }
        Update: {
          actual_time?: number | null
          category?: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["task_difficulty"]
          due_date?: string | null
          energy?: string | null
          estimated_time?: number
          id?: string
          node_id?: string | null
          priority?: number
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          value_score?: number | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          meta: Json | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          meta?: Json | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          meta?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_total_xp: {
        Args: { user_uuid?: string }
        Returns: number
      }
    }
    Enums: {
      achievement_rarity: "common" | "rare" | "epic" | "legendary"
      node_branch: "programming" | "finance" | "music"
      node_category: "skill" | "habit" | "milestone" | "project"
      node_status:
        | "locked"
        | "available"
        | "in_progress"
        | "completed"
        | "mastered"
      node_type: "basic" | "intermediate" | "advanced" | "master"
      session_type: "deep_work" | "practice" | "learning" | "review"
      task_category: "programming" | "finance" | "music" | "general"
      task_difficulty: "basic" | "intermediate" | "advanced"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      achievement_rarity: ["common", "rare", "epic", "legendary"],
      node_branch: ["programming", "finance", "music"],
      node_category: ["skill", "habit", "milestone", "project"],
      node_status: [
        "locked",
        "available",
        "in_progress",
        "completed",
        "mastered",
      ],
      node_type: ["basic", "intermediate", "advanced", "master"],
      session_type: ["deep_work", "practice", "learning", "review"],
      task_category: ["programming", "finance", "music", "general"],
      task_difficulty: ["basic", "intermediate", "advanced"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
