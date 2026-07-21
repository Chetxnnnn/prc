export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "admin" | "teacher" | "student";
          is_active: boolean;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: "admin" | "teacher" | "student";
          is_active?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "admin" | "teacher";
          is_active?: boolean;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string | null;
          date_of_birth: string;
          gender: "male" | "female";
          profile_photo_url: string | null;
          contact_number: string;
          parent_name: string;
          parent_contact: string;
          address: string | null;
          board: "cbse" | "icse" | "state";
          class_number: number;
          school_name: string | null;
          previous_academic_performance: string | null;
          subjects: string[];
          enrollment_date: string;
          status: "active" | "inactive" | "dropped";
          is_approved: boolean;
          monthly_fee: number;
          send_notifications: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name: string;
          email?: string | null;
          date_of_birth: string;
          gender: "male" | "female";
          profile_photo_url?: string | null;
          contact_number: string;
          parent_name: string;
          parent_contact: string;
          address?: string | null;
          board: "cbse" | "icse" | "state";
          class_number: number;
          school_name?: string | null;
          previous_academic_performance?: string | null;
          subjects?: string[];
          enrollment_date?: string;
          status?: "active" | "inactive" | "dropped";
          is_approved?: boolean;
          monthly_fee?: number;
          send_notifications?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string;
          email?: string | null;
          date_of_birth?: string;
          gender?: "male" | "female";
          profile_photo_url?: string | null;
          contact_number?: string;
          parent_name?: string;
          parent_contact?: string;
          address?: string | null;
          board?: "cbse" | "icse" | "state";
          class_number?: number;
          school_name?: string | null;
          previous_academic_performance?: string | null;
          subjects?: string[];
          enrollment_date?: string;
          status?: "active" | "inactive" | "dropped";
          is_approved?: boolean;
          monthly_fee?: number;
          send_notifications?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          attendance_date: string;
          status: "present" | "absent" | "late";
          marked_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          attendance_date: string;
          status: "present" | "absent" | "late";
          marked_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          attendance_date?: string;
          status?: "present" | "absent" | "late";
          marked_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fee_payments: {
        Row: {
          id: string;
          student_id: string;
          payment_month: string;
          amount: number;
          payment_date: string;
          mode: "cash" | "upi" | "bank_transfer" | "cheque";
          receipt_number: string | null;
          notes: string | null;
          recorded_by: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          payment_month: string;
          amount: number;
          payment_date?: string;
          mode: "cash" | "upi" | "bank_transfer" | "cheque";
          receipt_number?: string | null;
          notes?: string | null;
          recorded_by: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          payment_month?: string;
          amount?: number;
          payment_date?: string;
          mode?: "cash" | "upi" | "bank_transfer" | "cheque";
          receipt_number?: string | null;
          notes?: string | null;
          recorded_by?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fee_payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fee_payments_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          changed_by: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: "INSERT" | "UPDATE" | "DELETE";
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          changed_by: string;
          changed_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          record_id?: string;
          action?: "INSERT" | "UPDATE" | "DELETE";
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          changed_by?: string;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_logs: {
        Row: {
          id: string;
          student_id: string | null;
          channel: string;
          status: string;
          parent_contact: string | null;
          message: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          channel: string;
          status: string;
          parent_contact?: string | null;
          message?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          channel?: string;
          status?: string;
          parent_contact?: string | null;
          message?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_logs_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: "admin" | "teacher";
      };
      get_student_attendance_summary: {
        Args: {
          p_student_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          total_days: number;
          present_days: number;
          absent_days: number;
          late_days: number;
          attendance_pct: number;
        }[];
      };
      get_fee_collection_summary: {
        Args: { p_month?: string };
        Returns: {
          total_students: number;
          paid_count: number;
          partial_count: number;
          unpaid_count: number;
          total_collected: number;
          total_expected: number;
        }[];
      };
      batch_approve_students: {
        Args: { p_student_ids: string[]; p_approved: boolean };
        Returns: number;
      };
    };
    Enums: {
      app_role: "admin" | "teacher";
      student_status: "active" | "inactive" | "dropped";
      gender_type: "male" | "female";
      board_type: "cbse" | "icse" | "state";
      attendance_status: "present" | "absent" | "late";
      payment_method: "cash" | "upi" | "bank_transfer" | "cheque";
      audit_action: "INSERT" | "UPDATE" | "DELETE";
    };
  };
};

export type Tables<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Row"];

export type TablesInsert<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
