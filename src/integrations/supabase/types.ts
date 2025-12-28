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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      call_history: {
        Row: {
          call_date: string
          call_type: string | null
          contact_id: string | null
          contact_name: string | null
          duration: number | null
          id: string
          user_id: string
        }
        Insert: {
          call_date?: string
          call_type?: string | null
          contact_id?: string | null
          contact_name?: string | null
          duration?: number | null
          id?: string
          user_id: string
        }
        Update: {
          call_date?: string
          call_type?: string | null
          contact_id?: string | null
          contact_name?: string | null
          duration?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "family_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_wellness: {
        Row: {
          activity_goal_minutes: number | null
          activity_minutes: number | null
          created_at: string
          entry_date: string
          id: string
          sleep_goal_minutes: number | null
          sleep_minutes: number | null
          steps: number | null
          steps_goal: number | null
          user_id: string
        }
        Insert: {
          activity_goal_minutes?: number | null
          activity_minutes?: number | null
          created_at?: string
          entry_date?: string
          id?: string
          sleep_goal_minutes?: number | null
          sleep_minutes?: number | null
          steps?: number | null
          steps_goal?: number | null
          user_id: string
        }
        Update: {
          activity_goal_minutes?: number | null
          activity_minutes?: number | null
          created_at?: string
          entry_date?: string
          id?: string
          sleep_goal_minutes?: number | null
          sleep_minutes?: number | null
          steps?: number | null
          steps_goal?: number | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_size: string | null
          file_url: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_size?: string | null
          file_url?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_size?: string | null
          file_url?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          reminder: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          reminder?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          reminder?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      family_contacts: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_emergency_contact: boolean | null
          name: string
          phone: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_emergency_contact?: boolean | null
          name: string
          phone?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_emergency_contact?: boolean | null
          name?: string
          phone?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          duration_seconds: number | null
          game_type: string
          id: string
          played_at: string
          score: number | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          game_type: string
          id?: string
          played_at?: string
          score?: number | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          game_type?: string
          id?: string
          played_at?: string
          score?: number | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          record_date: string
          record_type: string
          title: string
          unit: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          record_date?: string
          record_type: string
          title: string
          unit?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          record_date?: string
          record_type?: string
          title?: string
          unit?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          mood_level: number
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          mood_level: number
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          mood_level?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_date: string
          payment_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_date?: string
          payment_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_date?: string
          payment_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      photo_albums: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          album: string | null
          album_id: string | null
          created_at: string
          id: string
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          album?: string | null
          album_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          album?: string | null
          album_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      secure_notes: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wellness_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          duration: number | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          duration?: number | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          duration?: number | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
