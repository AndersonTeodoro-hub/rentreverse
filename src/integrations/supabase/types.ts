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
      landlord_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          is_company: boolean | null
          properties_count: number | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          is_company?: boolean | null
          properties_count?: number | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          is_company?: boolean | null
          properties_count?: number | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          id: string
          landlord_email: string | null
          landlord_id: string
          landlord_phone: string | null
          message: string | null
          property_id: string
          proposed_move_in: string | null
          proposed_rent: number | null
          responded_at: string | null
          response_message: string | null
          status: Database["public"]["Enums"]["offer_status"]
          tenant_id: string
          tenant_request_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_email?: string | null
          landlord_id: string
          landlord_phone?: string | null
          message?: string | null
          property_id: string
          proposed_move_in?: string | null
          proposed_rent?: number | null
          responded_at?: string | null
          response_message?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          tenant_id: string
          tenant_request_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_email?: string | null
          landlord_id?: string
          landlord_phone?: string | null
          message?: string | null
          property_id?: string
          proposed_move_in?: string | null
          proposed_rent?: number | null
          responded_at?: string | null
          response_message?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          tenant_id?: string
          tenant_request_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_tenant_request_id_fkey"
            columns: ["tenant_request_id"]
            isOneToOne: false
            referencedRelation: "tenant_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      price_notifications: {
        Row: {
          created_at: string
          id: string
          new_price: number
          old_price: number
          property_id: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_price: number
          old_price: number
          property_id: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_price?: number
          old_price?: number
          property_id?: string
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_notifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          area_sqm: number | null
          available_from: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          pets_allowed: boolean | null
          postal_code: string | null
          property_type: string
          rent_amount: number
          smoking_allowed: boolean | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          pets_allowed?: boolean | null
          postal_code?: string | null
          property_type: string
          rent_amount: number
          smoking_allowed?: boolean | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          pets_allowed?: boolean | null
          postal_code?: string | null
          property_type?: string
          rent_amount?: number
          smoking_allowed?: boolean | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          points_awarded: number | null
          referred_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referred_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          points_awarded?: number | null
          referred_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_tenants: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      tenant_profiles: {
        Row: {
          created_at: string
          has_pets: boolean | null
          id: string
          is_smoker: boolean | null
          max_budget: number | null
          monthly_income: number | null
          move_in_date: string | null
          preferred_locations: string[] | null
          profession: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_pets?: boolean | null
          id?: string
          is_smoker?: boolean | null
          max_budget?: number | null
          monthly_income?: number | null
          move_in_date?: string | null
          preferred_locations?: string[] | null
          profession?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_pets?: boolean | null
          id?: string
          is_smoker?: boolean | null
          max_budget?: number | null
          monthly_income?: number | null
          move_in_date?: string | null
          preferred_locations?: string[] | null
          profession?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenant_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_budget: number | null
          min_bedrooms: number | null
          min_budget: number | null
          move_in_date: string | null
          preferred_cities: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_budget?: number | null
          min_bedrooms?: number | null
          min_budget?: number | null
          move_in_date?: string | null
          preferred_cities?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_budget?: number | null
          min_bedrooms?: number | null
          min_budget?: number | null
          move_in_date?: string | null
          preferred_cities?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          address_verified: boolean | null
          created_at: string
          employment_verified: boolean | null
          id: string
          identity_verified: boolean | null
          income_verified: boolean | null
          last_calculated_at: string | null
          reference_count: number | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_verified?: boolean | null
          created_at?: string
          employment_verified?: boolean | null
          id?: string
          identity_verified?: boolean | null
          income_verified?: boolean | null
          last_calculated_at?: string | null
          reference_count?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_verified?: boolean | null
          created_at?: string
          employment_verified?: boolean | null
          id?: string
          identity_verified?: boolean | null
          income_verified?: boolean | null
          last_calculated_at?: string | null
          reference_count?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          total_points: number | null
          updated_at: string
          used_points: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_points?: number | null
          updated_at?: string
          used_points?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_points?: number | null
          updated_at?: string
          used_points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_references: {
        Row: {
          created_at: string
          id: string
          reference_email: string
          reference_name: string
          reference_phone: string | null
          relationship: string
          status: Database["public"]["Enums"]["verification_status"]
          user_id: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reference_email: string
          reference_name: string
          reference_phone?: string | null
          relationship: string
          status?: Database["public"]["Enums"]["verification_status"]
          user_id: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reference_email?: string
          reference_name?: string
          reference_phone?: string | null
          relationship?: string
          status?: Database["public"]["Enums"]["verification_status"]
          user_id?: string
          verification_token?: string | null
          verified_at?: string | null
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
      user_verifications: {
        Row: {
          created_at: string
          document_url: string | null
          expires_at: string | null
          id: string
          notes: string | null
          points_awarded: number | null
          status: Database["public"]["Enums"]["verification_status"]
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          points_awarded?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          points_awarded?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trust_score: { Args: { _user_id: string }; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
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
      app_role: "tenant" | "landlord"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      property_status: "active" | "rented" | "inactive"
      verification_status: "pending" | "approved" | "rejected" | "expired"
      verification_type:
        | "identity"
        | "income"
        | "employment"
        | "reference"
        | "address"
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
      app_role: ["tenant", "landlord"],
      offer_status: ["pending", "accepted", "rejected", "expired", "cancelled"],
      property_status: ["active", "rented", "inactive"],
      verification_status: ["pending", "approved", "rejected", "expired"],
      verification_type: [
        "identity",
        "income",
        "employment",
        "reference",
        "address",
      ],
    },
  },
} as const
