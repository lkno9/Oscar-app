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
      administrative_tasks: {
        Row: {
          category: string | null
          created_at: string
          current_step: number | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          steps: Json | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          steps?: Json | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_step?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          steps?: Json | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      conversations: {
        Row: {
          id: string
          user_id: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      document_reminders: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          is_sent: boolean | null
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          is_sent?: boolean | null
          reminder_date: string
          reminder_type: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          is_sent?: boolean | null
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          document_type: string | null
          expiration_date: string | null
          file_size: string | null
          file_url: string | null
          id: string
          name: string
          reminder_enabled: boolean | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          document_type?: string | null
          expiration_date?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          name: string
          reminder_enabled?: boolean | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          document_type?: string | null
          expiration_date?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          name?: string
          reminder_enabled?: boolean | null
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
      family_links: {
        Row: {
          accepted_at: string | null
          created_at: string
          family_member_id: string
          id: string
          invitation_code: string | null
          relationship: string
          senior_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          family_member_id: string
          id?: string
          invitation_code?: string | null
          relationship?: string
          senior_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          family_member_id?: string
          id?: string
          invitation_code?: string | null
          relationship?: string
          senior_id?: string
          status?: string
        }
        Relationships: []
      }
      family_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      family_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          senior_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          senior_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          senior_id?: string | null
          title?: string
          type?: string
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
      partner_services: {
        Row: {
          affiliate_url: string
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          info_url: string | null
          is_active: boolean
          is_partner: boolean
          name: string
          promo_code: string | null
          promo_value: string | null
          tags: string[] | null
          updated_at: string
          why_we_recommend: string
        }
        Insert: {
          affiliate_url: string
          category: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          info_url?: string | null
          is_active?: boolean
          is_partner?: boolean
          name: string
          promo_code?: string | null
          promo_value?: string | null
          tags?: string[] | null
          updated_at?: string
          why_we_recommend: string
        }
        Update: {
          affiliate_url?: string
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          info_url?: string | null
          is_active?: boolean
          is_partner?: boolean
          name?: string
          promo_code?: string | null
          promo_value?: string | null
          tags?: string[] | null
          updated_at?: string
          why_we_recommend?: string
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
          auth_pin: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          phone_number: string | null
          quick_actions: string[] | null
          sms_notifications_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          auth_pin?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          phone_number?: string | null
          quick_actions?: string[] | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          auth_pin?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_number?: string | null
          quick_actions?: string[] | null
          sms_notifications_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_history: {
        Row: {
          created_at: string
          id: string
          quiz_date: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_date?: string
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quiz_date?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      rss_sources: {
        Row: {
          category: string
          created_at: string
          display_order: number
          emoji: string
          id: string
          is_active: boolean
          source_name: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          source_name: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          source_name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      scam_alerts: {
        Row: {
          category: string
          created_at: string
          danger_level: string
          date_detected: string
          description: string
          id: string
          is_active: boolean
          source: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          danger_level: string
          date_detected?: string
          description: string
          id?: string
          is_active?: boolean
          source?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          danger_level?: string
          date_detected?: string
          description?: string
          id?: string
          is_active?: boolean
          source?: string | null
          title?: string
        }
        Relationships: []
      }
      scam_checks: {
        Row: {
          content_checked: string
          created_at: string
          explanation: string
          id: string
          recommendation: string | null
          red_flags: string[] | null
          risk_level: string
          user_id: string
        }
        Insert: {
          content_checked: string
          created_at?: string
          explanation: string
          id?: string
          recommendation?: string | null
          red_flags?: string[] | null
          risk_level: string
          user_id: string
        }
        Update: {
          content_checked?: string
          created_at?: string
          explanation?: string
          id?: string
          recommendation?: string | null
          red_flags?: string[] | null
          risk_level?: string
          user_id?: string
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
      security_quiz_scores: {
        Row: {
          completed_at: string
          id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          score: number
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          achievements: string[]
          articles_read: number
          created_at: string
          id: string
          level: string
          oscar_conversations: number
          quizzes_completed: number
          total_stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[]
          articles_read?: number
          created_at?: string
          id?: string
          level?: string
          oscar_conversations?: number
          quizzes_completed?: number
          total_stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[]
          articles_read?: number
          created_at?: string
          id?: string
          level?: string
          oscar_conversations?: number
          quizzes_completed?: number
          total_stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          streak_grace_used: boolean
          total_active_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          streak_grace_used?: boolean
          total_active_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          streak_grace_used?: boolean
          total_active_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_otps: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          otp_code: string
          phone_number: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          otp_code: string
          phone_number: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          otp_code?: string
          phone_number?: string
          used?: boolean | null
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
      accept_family_invitation: {
        Args: { _family_member_id: string; _invitation_code: string }
        Returns: Json
      }
      custom_sms_hook: { Args: { event: Json }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "senior" | "family_member"
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
      app_role: ["senior", "family_member"],
    },
  },
} as const
