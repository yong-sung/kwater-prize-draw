export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_login_attempts: {
        Row: {
          blocked_until: string | null;
          created_at: string;
          failures: number;
          ip_hash: string;
          updated_at: string;
        };
        Insert: {
          blocked_until?: string | null;
          created_at?: string;
          failures?: number;
          ip_hash: string;
          updated_at?: string;
        };
        Update: {
          blocked_until?: string | null;
          created_at?: string;
          failures?: number;
          ip_hash?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          detail: Json;
          event_id: string | null;
          id: number;
          reason: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          detail?: Json;
          event_id?: string | null;
          id?: never;
          reason?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          detail?: Json;
          event_id?: string | null;
          id?: never;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      draw_results: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          participant_id: string | null;
          prize_id: string;
          replaced_at: string | null;
          replacement_reason: string | null;
          reveal_position: number;
          revealed_at: string | null;
          unawarded_at: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          participant_id?: string | null;
          prize_id: string;
          replaced_at?: string | null;
          replacement_reason?: string | null;
          reveal_position: number;
          revealed_at?: string | null;
          unawarded_at?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          participant_id?: string | null;
          prize_id?: string;
          replaced_at?: string | null;
          replacement_reason?: string | null;
          reveal_position?: number;
          revealed_at?: string | null;
          unawarded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "draw_results_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "draw_results_event_participant_fkey";
            columns: ["event_id", "participant_id"];
            isOneToOne: true;
            referencedRelation: "participants";
            referencedColumns: ["event_id", "id"];
          },
          {
            foreignKeyName: "draw_results_event_prize_fkey";
            columns: ["event_id", "prize_id"];
            isOneToOne: false;
            referencedRelation: "prizes";
            referencedColumns: ["event_id", "id"];
          },
          {
            foreignKeyName: "draw_results_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "draw_results_prize_id_fkey";
            columns: ["prize_id"];
            isOneToOne: false;
            referencedRelation: "prizes";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          privacy_items: string[];
          privacy_purpose: string;
          published_at: string | null;
          purge_at: string | null;
          retention_days: number;
          starts_at: string | null;
          status: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at: string;
          venue: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          privacy_items?: string[];
          privacy_purpose?: string;
          published_at?: string | null;
          purge_at?: string | null;
          retention_days?: number;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at?: string;
          venue?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          privacy_items?: string[];
          privacy_purpose?: string;
          published_at?: string | null;
          purge_at?: string | null;
          retention_days?: number;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["event_status"];
          title?: string;
          updated_at?: string;
          venue?: string;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          access_token_hash: string;
          consented_at: string;
          created_at: string;
          department_ciphertext: string;
          disqualified_at: string | null;
          event_id: string;
          id: string;
          name_ciphertext: string;
          phone_ciphertext: string;
          phone_hash: string;
        };
        Insert: {
          access_token_hash: string;
          consented_at: string;
          created_at?: string;
          department_ciphertext: string;
          disqualified_at?: string | null;
          event_id: string;
          id?: string;
          name_ciphertext: string;
          phone_ciphertext: string;
          phone_hash: string;
        };
        Update: {
          access_token_hash?: string;
          consented_at?: string;
          created_at?: string;
          department_ciphertext?: string;
          disqualified_at?: string | null;
          event_id?: string;
          id?: string;
          name_ciphertext?: string;
          phone_ciphertext?: string;
          phone_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      prizes: {
        Row: {
          code: Database["public"]["Enums"]["prize_code"];
          created_at: string;
          event_id: string;
          id: string;
          name: string;
          quantity: number;
          reveal_order: number;
          updated_at: string;
        };
        Insert: {
          code: Database["public"]["Enums"]["prize_code"];
          created_at?: string;
          event_id: string;
          id?: string;
          name: string;
          quantity: number;
          reveal_order: number;
          updated_at?: string;
        };
        Update: {
          code?: Database["public"]["Enums"]["prize_code"];
          created_at?: string;
          event_id?: string;
          id?: string;
          name?: string;
          quantity?: number;
          reveal_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prizes_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      reveal_state: {
        Row: {
          event_id: string;
          revealed_count: number;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          revealed_count?: number;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          revealed_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reveal_state_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      draw_replacement: {
        Args: { p_event_id: string; p_reason: string; p_result_id: string };
        Returns: Json;
      };
      execute_draw: { Args: { p_event_id: string }; Returns: number };
      publish_results: { Args: { p_event_id: string }; Returns: Json };
      purge_expired_events: { Args: never; Returns: Json };
      record_admin_login_failure: {
        Args: { p_ip_hash: string; p_now?: string };
        Returns: {
          blocked: boolean;
          blocked_until: string;
        }[];
      };
      reveal_next: { Args: { p_event_id: string }; Returns: Json };
      reveal_next_in_group: {
        Args: {
          p_event_id: string;
          p_expected_prize_code:
            Database["public"]["Enums"]["prize_code"] | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      event_status:
        | "SETUP"
        | "OPEN"
        | "CLOSED"
        | "DRAWN"
        | "REVEALING"
        | "REVEALED"
        | "PUBLISHED"
        | "PURGED";
      prize_code: "SCANNER" | "TUMBLER" | "KEYBOARD";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      event_status: [
        "SETUP",
        "OPEN",
        "CLOSED",
        "DRAWN",
        "REVEALING",
        "REVEALED",
        "PUBLISHED",
        "PURGED",
      ],
      prize_code: ["SCANNER", "TUMBLER", "KEYBOARD"],
    },
  },
} as const;
