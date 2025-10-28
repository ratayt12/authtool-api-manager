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
      device_sessions: {
        Row: {
          approved_by: string | null
          created_at: string
          device_fingerprint: string
          device_info: Json
          id: string
          ip_address: string | null
          is_approved: boolean
          last_active: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          device_fingerprint: string
          device_info?: Json
          id?: string
          ip_address?: string | null
          is_approved?: boolean
          last_active?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          device_fingerprint?: string
          device_info?: Json
          id?: string
          ip_address?: string | null
          is_approved?: boolean
          last_active?: string
          user_id?: string
        }
        Relationships: []
      }
      keys: {
        Row: {
          activate_count: number
          activate_limit: number
          created_at: string
          duration: Database["public"]["Enums"]["key_duration"]
          expired_at: string | null
          id: string
          is_cleanable: boolean
          key_code: string
          package_ids: number[]
          status: string
          user_id: string
        }
        Insert: {
          activate_count?: number
          activate_limit?: number
          created_at?: string
          duration: Database["public"]["Enums"]["key_duration"]
          expired_at?: string | null
          id?: string
          is_cleanable?: boolean
          key_code: string
          package_ids?: number[]
          status?: string
          user_id: string
        }
        Update: {
          activate_count?: number
          activate_limit?: number
          created_at?: string
          duration?: Database["public"]["Enums"]["key_duration"]
          expired_at?: string | null
          id?: string
          is_cleanable?: boolean
          key_code?: string
          package_ids?: number[]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          message: string | null
          sender_name: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message?: string | null
          sender_name?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message?: string | null
          sender_name?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          background_color: string | null
          ban_message: string | null
          ban_until: string | null
          created_at: string
          credits: number
          id: string
          last_username_change: string | null
          lightning_color: string | null
          segment_color: string | null
          theme_colors: Json | null
          updated_at: string
          username: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          background_color?: string | null
          ban_message?: string | null
          ban_until?: string | null
          created_at?: string
          credits?: number
          id: string
          last_username_change?: string | null
          lightning_color?: string | null
          segment_color?: string | null
          theme_colors?: Json | null
          updated_at?: string
          username: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          background_color?: string | null
          ban_message?: string | null
          ban_until?: string | null
          created_at?: string
          credits?: number
          id?: string
          last_username_change?: string | null
          lightning_color?: string | null
          segment_color?: string | null
          theme_colors?: Json | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_admin: boolean
          message: string | null
          user_id: string
          username: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin?: boolean
          message?: string | null
          user_id: string
          username?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin?: boolean
          message?: string | null
          user_id?: string
          username?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_requests: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          key_code: string | null
          request_type: string
          status: string
          udid: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          key_code?: string | null
          request_type: string
          status?: string
          udid?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          key_code?: string | null
          request_type?: string
          status?: string
          udid?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          approved_by: string | null
          created_at: string
          device_fingerprint: string
          device_info: Json
          id: string
          is_approved: boolean
          last_active: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          device_fingerprint: string
          device_info: Json
          id?: string
          is_approved?: boolean
          last_active?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          device_fingerprint?: string
          device_info?: Json
          id?: string
          is_approved?: boolean
          last_active?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_old_private_messages: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner"
      approval_status: "pending" | "approved" | "rejected"
      key_duration: "1day" | "1week" | "25days"
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
      app_role: ["admin", "user", "owner"],
      approval_status: ["pending", "approved", "rejected"],
      key_duration: ["1day", "1week", "25days"],
    },
  },
} as const
