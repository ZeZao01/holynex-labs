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
      orcamentos: {
        Row: {
          criado_em: string
          descricao: string
          email: string
          empresa: string | null
          id: string
          nome: string
          prioridade: string | null
          resumo_ia: string | null
          status: string
        }
        Insert: {
          criado_em?: string
          descricao: string
          email: string
          empresa?: string | null
          id?: string
          nome: string
          prioridade?: string | null
          resumo_ia?: string | null
          status?: string
        }
        Update: {
          criado_em?: string
          descricao?: string
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          prioridade?: string | null
          resumo_ia?: string | null
          status?: string
        }
        Relationships: []
      }
      pdf_versoes: {
        Row: {
          criado_em: string
          id: string
          nome_arquivo: string
          proposta_id: string
          storage_path: string
          tamanho_bytes: number | null
          versao: number
        }
        Insert: {
          criado_em?: string
          id?: string
          nome_arquivo: string
          proposta_id: string
          storage_path: string
          tamanho_bytes?: number | null
          versao?: number
        }
        Update: {
          criado_em?: string
          id?: string
          nome_arquivo?: string
          proposta_id?: string
          storage_path?: string
          tamanho_bytes?: number | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdf_versoes_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          atualizado_em: string
          classificacao_margem: string | null
          closing_strategy: string | null
          commercial_notes: Json | null
          complexidade: string | null
          criado_em: string
          descricao_projeto: string
          email_cliente: string | null
          empresa_cliente: string | null
          funcionalidades_desejadas: string[] | null
          id: string
          integracoes: string[] | null
          is_phased: boolean | null
          link_referencia: string | null
          nivel_urgencia: string | null
          nome_cliente: string
          numero_usuarios: string | null
          objetivo_cliente: string | null
          observacoes: string | null
          orcamento_cliente: string | null
          orcamento_id: string | null
          prazo_desejado: string | null
          problema_cliente: string | null
          proposal_addons: Json | null
          proposal_tiers: Json | null
          proposal_validity: string | null
          proposta_json: Json | null
          proposta_texto: string | null
          recommended_tier: string | null
          segmento: string | null
          status: string
          tipo_projeto: string
          valor_ideal: number | null
          valor_minimo: number | null
          valor_premium: number | null
        }
        Insert: {
          atualizado_em?: string
          classificacao_margem?: string | null
          closing_strategy?: string | null
          commercial_notes?: Json | null
          complexidade?: string | null
          criado_em?: string
          descricao_projeto: string
          email_cliente?: string | null
          empresa_cliente?: string | null
          funcionalidades_desejadas?: string[] | null
          id?: string
          integracoes?: string[] | null
          is_phased?: boolean | null
          link_referencia?: string | null
          nivel_urgencia?: string | null
          nome_cliente: string
          numero_usuarios?: string | null
          objetivo_cliente?: string | null
          observacoes?: string | null
          orcamento_cliente?: string | null
          orcamento_id?: string | null
          prazo_desejado?: string | null
          problema_cliente?: string | null
          proposal_addons?: Json | null
          proposal_tiers?: Json | null
          proposal_validity?: string | null
          proposta_json?: Json | null
          proposta_texto?: string | null
          recommended_tier?: string | null
          segmento?: string | null
          status?: string
          tipo_projeto?: string
          valor_ideal?: number | null
          valor_minimo?: number | null
          valor_premium?: number | null
        }
        Update: {
          atualizado_em?: string
          classificacao_margem?: string | null
          closing_strategy?: string | null
          commercial_notes?: Json | null
          complexidade?: string | null
          criado_em?: string
          descricao_projeto?: string
          email_cliente?: string | null
          empresa_cliente?: string | null
          funcionalidades_desejadas?: string[] | null
          id?: string
          integracoes?: string[] | null
          is_phased?: boolean | null
          link_referencia?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string
          numero_usuarios?: string | null
          objetivo_cliente?: string | null
          observacoes?: string | null
          orcamento_cliente?: string | null
          orcamento_id?: string | null
          prazo_desejado?: string | null
          problema_cliente?: string | null
          proposal_addons?: Json | null
          proposal_tiers?: Json | null
          proposal_validity?: string | null
          proposta_json?: Json | null
          proposta_texto?: string | null
          recommended_tier?: string | null
          segmento?: string | null
          status?: string
          tipo_projeto?: string
          valor_ideal?: number | null
          valor_minimo?: number | null
          valor_premium?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
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
