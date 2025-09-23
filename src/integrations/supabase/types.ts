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
          user_id?: string
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
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          domain: string
          est_total_minutes: number | null
          goal_type: string
          id: string
          mastered_at: string | null
          metadata: Json
          parent_id: string | null
          position_x: number
          position_y: number
          prerequisites: string[] | null
          progress: number
          status: Database["public"]["Enums"]["node_status"]
          time_spent: number
          title: string
          unlocks: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          domain?: string
          est_total_minutes?: number | null
          goal_type?: string
          id?: string
          mastered_at?: string | null
          metadata?: Json
          parent_id?: string | null
          position_x?: number
          position_y?: number
          prerequisites?: string[] | null
          progress?: number
          status?: Database["public"]["Enums"]["node_status"]
          time_spent?: number
          title: string
          unlocks?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          domain?: string
          est_total_minutes?: number | null
          goal_type?: string
          id?: string
          mastered_at?: string | null
          metadata?: Json
          parent_id?: string | null
          position_x?: number
          position_y?: number
          prerequisites?: string[] | null
          progress?: number
          status?: Database["public"]["Enums"]["node_status"]
          time_spent?: number
          title?: string
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
          user_id?: string
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
      subtasks: {
        Row: {
          created_at: string
          earliest_start: string | null
          est_minutes: number
          hard_window: unknown | null
          id: string
          seq: number | null
          status: Database["public"]["Enums"]["subtask_status"]
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
          status?: Database["public"]["Enums"]["subtask_status"]
          tags?: string[] | null
          task_id: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          earliest_start?: string | null
          est_minutes?: number
          hard_window?: unknown | null
          id?: string
          seq?: number | null
          status?: Database["public"]["Enums"]["subtask_status"]
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
          title: string
          updated_at?: string
          user_id?: string
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
          user_id?: string
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
      subtask_status: "todo" | "in_progress" | "done" | "blocked"
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
      subtask_status: ["todo", "in_progress", "done", "blocked"],
      task_category: ["programming", "finance", "music", "general"],
      task_difficulty: ["basic", "intermediate", "advanced"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
