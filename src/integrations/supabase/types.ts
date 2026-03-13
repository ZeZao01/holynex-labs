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
      audit_logs: {
        Row: {
          action: string
          criado_em: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          criado_em?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          criado_em?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      delivered_system_events: {
        Row: {
          criado_em: string | null
          descricao: string | null
          evento: string
          id: string
          system_id: string
        }
        Insert: {
          criado_em?: string | null
          descricao?: string | null
          evento: string
          id?: string
          system_id: string
        }
        Update: {
          criado_em?: string | null
          descricao?: string | null
          evento?: string
          id?: string
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivered_system_events_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      delivered_system_tags: {
        Row: {
          id: string
          system_id: string
          tag: string
          tipo: string | null
        }
        Insert: {
          id?: string
          system_id: string
          tag: string
          tipo?: string | null
        }
        Update: {
          id?: string
          system_id?: string
          tag?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivered_system_tags_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      delivered_systems: {
        Row: {
          admin_url: string | null
          analytics_url: string | null
          ativo: boolean | null
          atualizado_em: string | null
          banco_dados: string | null
          categoria: string | null
          cliente: string
          criado_em: string | null
          data_entrega: string | null
          descricao_interna: string | null
          design_url: string | null
          destaque_interno: boolean | null
          docs_url: string | null
          empresa_cliente: string | null
          faixa_contratada: string | null
          faixa_ticket: string | null
          id: string
          integracoes: string[] | null
          live_url: string | null
          nicho: string | null
          nome: string
          observacoes_comerciais: string | null
          observacoes_tecnicas: string | null
          potencial_reuso: string | null
          projeto_origem_id: string | null
          recorrencia_mensal: number | null
          repo_url: string | null
          resumo_curto: string | null
          reutilizavel: boolean | null
          stack_principal: string[] | null
          staging_url: string | null
          status_operacional: string | null
          status_suporte: string | null
          thumbnail_url: string | null
          tipo_projeto: string | null
          ultima_atualizacao: string | null
          valor_fechado: number | null
          versao_atual: string | null
        }
        Insert: {
          admin_url?: string | null
          analytics_url?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          banco_dados?: string | null
          categoria?: string | null
          cliente?: string
          criado_em?: string | null
          data_entrega?: string | null
          descricao_interna?: string | null
          design_url?: string | null
          destaque_interno?: boolean | null
          docs_url?: string | null
          empresa_cliente?: string | null
          faixa_contratada?: string | null
          faixa_ticket?: string | null
          id?: string
          integracoes?: string[] | null
          live_url?: string | null
          nicho?: string | null
          nome: string
          observacoes_comerciais?: string | null
          observacoes_tecnicas?: string | null
          potencial_reuso?: string | null
          projeto_origem_id?: string | null
          recorrencia_mensal?: number | null
          repo_url?: string | null
          resumo_curto?: string | null
          reutilizavel?: boolean | null
          stack_principal?: string[] | null
          staging_url?: string | null
          status_operacional?: string | null
          status_suporte?: string | null
          thumbnail_url?: string | null
          tipo_projeto?: string | null
          ultima_atualizacao?: string | null
          valor_fechado?: number | null
          versao_atual?: string | null
        }
        Update: {
          admin_url?: string | null
          analytics_url?: string | null
          ativo?: boolean | null
          atualizado_em?: string | null
          banco_dados?: string | null
          categoria?: string | null
          cliente?: string
          criado_em?: string | null
          data_entrega?: string | null
          descricao_interna?: string | null
          design_url?: string | null
          destaque_interno?: boolean | null
          docs_url?: string | null
          empresa_cliente?: string | null
          faixa_contratada?: string | null
          faixa_ticket?: string | null
          id?: string
          integracoes?: string[] | null
          live_url?: string | null
          nicho?: string | null
          nome?: string
          observacoes_comerciais?: string | null
          observacoes_tecnicas?: string | null
          potencial_reuso?: string | null
          projeto_origem_id?: string | null
          recorrencia_mensal?: number | null
          repo_url?: string | null
          resumo_curto?: string | null
          reutilizavel?: boolean | null
          stack_principal?: string[] | null
          staging_url?: string | null
          status_operacional?: string | null
          status_suporte?: string | null
          thumbnail_url?: string | null
          tipo_projeto?: string | null
          ultima_atualizacao?: string | null
          valor_fechado?: number | null
          versao_atual?: string | null
        }
        Relationships: []
      }
      niche_metrics: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          demand_score: number | null
          id: string
          margem_media: number | null
          nicho: string
          opportunity_score: number | null
          qtd_leads: number | null
          qtd_projetos: number | null
          qtd_propostas: number | null
          recorrencia_media: number | null
          ticket_medio: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          demand_score?: number | null
          id?: string
          margem_media?: number | null
          nicho: string
          opportunity_score?: number | null
          qtd_leads?: number | null
          qtd_projetos?: number | null
          qtd_propostas?: number | null
          recorrencia_media?: number | null
          ticket_medio?: number | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          demand_score?: number | null
          id?: string
          margem_media?: number | null
          nicho?: string
          opportunity_score?: number | null
          qtd_leads?: number | null
          qtd_projetos?: number | null
          qtd_propostas?: number | null
          recorrencia_media?: number | null
          ticket_medio?: number | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          aceita_mvp: boolean | null
          complexidade_estimada: string | null
          criado_em: string
          descricao: string
          dor_principal: string | null
          email: string
          empresa: string | null
          estagio_operacao: string | null
          estrategia_comercial: string | null
          faixa_investimento: string | null
          faixa_ticket: string | null
          id: string
          nicho: string | null
          nome: string
          numero_usuarios: string | null
          objetivo: string | null
          observacoes_internas: string | null
          origem_lead: string | null
          prazo_desejado: string | null
          precisa_admin: boolean | null
          precisa_app_mobile: boolean | null
          precisa_area_cliente: boolean | null
          precisa_integracoes: boolean | null
          precisa_login: boolean | null
          prioridade: string | null
          resumo_ia: string | null
          score_qualificacao: number | null
          status: string
          status_comercial: string | null
          tags_automaticas: string[] | null
          temperatura_lead: string | null
          tipo_projeto: string | null
          urgencia: string | null
        }
        Insert: {
          aceita_mvp?: boolean | null
          complexidade_estimada?: string | null
          criado_em?: string
          descricao: string
          dor_principal?: string | null
          email: string
          empresa?: string | null
          estagio_operacao?: string | null
          estrategia_comercial?: string | null
          faixa_investimento?: string | null
          faixa_ticket?: string | null
          id?: string
          nicho?: string | null
          nome: string
          numero_usuarios?: string | null
          objetivo?: string | null
          observacoes_internas?: string | null
          origem_lead?: string | null
          prazo_desejado?: string | null
          precisa_admin?: boolean | null
          precisa_app_mobile?: boolean | null
          precisa_area_cliente?: boolean | null
          precisa_integracoes?: boolean | null
          precisa_login?: boolean | null
          prioridade?: string | null
          resumo_ia?: string | null
          score_qualificacao?: number | null
          status?: string
          status_comercial?: string | null
          tags_automaticas?: string[] | null
          temperatura_lead?: string | null
          tipo_projeto?: string | null
          urgencia?: string | null
        }
        Update: {
          aceita_mvp?: boolean | null
          complexidade_estimada?: string | null
          criado_em?: string
          descricao?: string
          dor_principal?: string | null
          email?: string
          empresa?: string | null
          estagio_operacao?: string | null
          estrategia_comercial?: string | null
          faixa_investimento?: string | null
          faixa_ticket?: string | null
          id?: string
          nicho?: string | null
          nome?: string
          numero_usuarios?: string | null
          objetivo?: string | null
          observacoes_internas?: string | null
          origem_lead?: string | null
          prazo_desejado?: string | null
          precisa_admin?: boolean | null
          precisa_app_mobile?: boolean | null
          precisa_area_cliente?: boolean | null
          precisa_integracoes?: boolean | null
          precisa_login?: boolean | null
          prioridade?: string | null
          resumo_ia?: string | null
          score_qualificacao?: number | null
          status?: string
          status_comercial?: string | null
          tags_automaticas?: string[] | null
          temperatura_lead?: string | null
          tipo_projeto?: string | null
          urgencia?: string | null
        }
        Relationships: []
      }
      pdf_versoes: {
        Row: {
          criado_em: string
          document_code: string | null
          document_hash: string | null
          emissor_id: string | null
          id: string
          nome_arquivo: string
          proposta_id: string
          snapshot: Json | null
          status: string | null
          storage_path: string
          tamanho_bytes: number | null
          template_used: string | null
          versao: number
        }
        Insert: {
          criado_em?: string
          document_code?: string | null
          document_hash?: string | null
          emissor_id?: string | null
          id?: string
          nome_arquivo: string
          proposta_id: string
          snapshot?: Json | null
          status?: string | null
          storage_path: string
          tamanho_bytes?: number | null
          template_used?: string | null
          versao?: number
        }
        Update: {
          criado_em?: string
          document_code?: string | null
          document_hash?: string | null
          emissor_id?: string | null
          id?: string
          nome_arquivo?: string
          proposta_id?: string
          snapshot?: Json | null
          status?: string | null
          storage_path?: string
          tamanho_bytes?: number | null
          template_used?: string | null
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
      portfolio_item_events: {
        Row: {
          criado_em: string | null
          descricao: string | null
          evento: string
          id: string
          portfolio_item_id: string
        }
        Insert: {
          criado_em?: string | null
          descricao?: string | null
          evento: string
          id?: string
          portfolio_item_id: string
        }
        Update: {
          criado_em?: string | null
          descricao?: string | null
          evento?: string
          id?: string
          portfolio_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_item_events_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          atualizado_em: string | null
          badges: string[] | null
          category: string | null
          client_context: string | null
          commercial_description: string | null
          cover_image_url: string | null
          criado_em: string | null
          cta_label: string | null
          cta_url: string | null
          customization_notes: string | null
          delivered_system_id: string | null
          differentials: string[] | null
          display_order: number | null
          gallery_urls: string[] | null
          highlight_section: string | null
          hover_image_url: string | null
          id: string
          investment_range: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_highlighted: boolean | null
          item_type: string | null
          main_modules: string[] | null
          niche: string | null
          objective: string | null
          problem_solved: string | null
          public_url: string | null
          short_description: string | null
          solution_type: string | null
          subtitle: string | null
          target_audience: string | null
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          atualizado_em?: string | null
          badges?: string[] | null
          category?: string | null
          client_context?: string | null
          commercial_description?: string | null
          cover_image_url?: string | null
          criado_em?: string | null
          cta_label?: string | null
          cta_url?: string | null
          customization_notes?: string | null
          delivered_system_id?: string | null
          differentials?: string[] | null
          display_order?: number | null
          gallery_urls?: string[] | null
          highlight_section?: string | null
          hover_image_url?: string | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_highlighted?: boolean | null
          item_type?: string | null
          main_modules?: string[] | null
          niche?: string | null
          objective?: string | null
          problem_solved?: string | null
          public_url?: string | null
          short_description?: string | null
          solution_type?: string | null
          subtitle?: string | null
          target_audience?: string | null
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          atualizado_em?: string | null
          badges?: string[] | null
          category?: string | null
          client_context?: string | null
          commercial_description?: string | null
          cover_image_url?: string | null
          criado_em?: string | null
          cta_label?: string | null
          cta_url?: string | null
          customization_notes?: string | null
          delivered_system_id?: string | null
          differentials?: string[] | null
          display_order?: number | null
          gallery_urls?: string[] | null
          highlight_section?: string | null
          hover_image_url?: string | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_highlighted?: boolean | null
          item_type?: string | null
          main_modules?: string[] | null
          niche?: string | null
          objective?: string | null
          problem_solved?: string | null
          public_url?: string | null
          short_description?: string | null
          solution_type?: string | null
          subtitle?: string | null
          target_audience?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_performance_metrics: {
        Row: {
          atualizado_em: string | null
          cliques: number | null
          conversoes_lead: number | null
          criado_em: string | null
          ctas_acionados: number | null
          demand_score: number | null
          id: string
          opportunity_score: number | null
          portfolio_item_id: string | null
          visualizacoes: number | null
        }
        Insert: {
          atualizado_em?: string | null
          cliques?: number | null
          conversoes_lead?: number | null
          criado_em?: string | null
          ctas_acionados?: number | null
          demand_score?: number | null
          id?: string
          opportunity_score?: number | null
          portfolio_item_id?: string | null
          visualizacoes?: number | null
        }
        Update: {
          atualizado_em?: string | null
          cliques?: number | null
          conversoes_lead?: number | null
          criado_em?: string | null
          ctas_acionados?: number | null
          demand_score?: number | null
          id?: string
          opportunity_score?: number | null
          portfolio_item_id?: string | null
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_performance_metrics_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: true
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_access_events: {
        Row: {
          access_id: string
          criado_em: string | null
          descricao: string | null
          evento: string
          id: string
        }
        Insert: {
          access_id: string
          criado_em?: string | null
          descricao?: string | null
          evento: string
          id?: string
        }
        Update: {
          access_id?: string
          criado_em?: string | null
          descricao?: string | null
          evento?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_events_access_id_fkey"
            columns: ["access_id"]
            isOneToOne: false
            referencedRelation: "project_accesses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_accesses: {
        Row: {
          access_type: string
          access_url: string | null
          atualizado_em: string | null
          criado_em: string | null
          delivered_system_id: string | null
          environment: string | null
          friendly_name: string
          id: string
          last_verified_at: string | null
          notes: string | null
          owner_name: string | null
          project_id: string | null
          provider_name: string | null
          secret_masked: string | null
          secret_reference: string | null
          status: string | null
          username: string | null
        }
        Insert: {
          access_type?: string
          access_url?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          delivered_system_id?: string | null
          environment?: string | null
          friendly_name?: string
          id?: string
          last_verified_at?: string | null
          notes?: string | null
          owner_name?: string | null
          project_id?: string | null
          provider_name?: string | null
          secret_masked?: string | null
          secret_reference?: string | null
          status?: string | null
          username?: string | null
        }
        Update: {
          access_type?: string
          access_url?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          delivered_system_id?: string | null
          environment?: string | null
          friendly_name?: string
          id?: string
          last_verified_at?: string | null
          notes?: string | null
          owner_name?: string | null
          project_id?: string | null
          provider_name?: string | null
          secret_masked?: string | null
          secret_reference?: string | null
          status?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_accesses_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      project_change_events: {
        Row: {
          change_id: string
          criado_em: string | null
          descricao: string | null
          evento: string
          id: string
        }
        Insert: {
          change_id: string
          criado_em?: string | null
          descricao?: string | null
          evento: string
          id?: string
        }
        Update: {
          change_id?: string
          criado_em?: string | null
          descricao?: string | null
          evento?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_change_events_change_id_fkey"
            columns: ["change_id"]
            isOneToOne: false
            referencedRelation: "project_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_changes: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_to_name: string | null
          atualizado_em: string | null
          billing_mode: string | null
          change_type: string
          commercial_notes: string | null
          completed_at: string | null
          criado_em: string | null
          delivered_system_id: string | null
          desired_deadline: string | null
          detailed_description: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          internal_notes: string | null
          is_included_in_contract: boolean | null
          needs_approval: boolean | null
          opportunity_tag: string | null
          planned_date: string | null
          priority: string
          project_id: string | null
          project_module_id: string | null
          request_origin: string | null
          requested_at: string | null
          requested_by_name: string | null
          short_description: string | null
          status: string
          title: string
          urgency: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to_name?: string | null
          atualizado_em?: string | null
          billing_mode?: string | null
          change_type?: string
          commercial_notes?: string | null
          completed_at?: string | null
          criado_em?: string | null
          delivered_system_id?: string | null
          desired_deadline?: string | null
          detailed_description?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          internal_notes?: string | null
          is_included_in_contract?: boolean | null
          needs_approval?: boolean | null
          opportunity_tag?: string | null
          planned_date?: string | null
          priority?: string
          project_id?: string | null
          project_module_id?: string | null
          request_origin?: string | null
          requested_at?: string | null
          requested_by_name?: string | null
          short_description?: string | null
          status?: string
          title: string
          urgency?: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to_name?: string | null
          atualizado_em?: string | null
          billing_mode?: string | null
          change_type?: string
          commercial_notes?: string | null
          completed_at?: string | null
          criado_em?: string | null
          delivered_system_id?: string | null
          desired_deadline?: string | null
          detailed_description?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          internal_notes?: string | null
          is_included_in_contract?: boolean | null
          needs_approval?: boolean | null
          opportunity_tag?: string | null
          planned_date?: string | null
          priority?: string
          project_id?: string | null
          project_module_id?: string | null
          request_origin?: string | null
          requested_at?: string | null
          requested_by_name?: string | null
          short_description?: string | null
          status?: string
          title?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_changes_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      project_model_performance_metrics: {
        Row: {
          atualizado_em: string
          cliques: number
          criado_em: string
          delivered_system_id: string | null
          demand_score: number
          id: string
          leads_gerados: number
          model_name: string
          opportunity_score: number
          portfolio_item_id: string | null
          versao_mais_procurada: string | null
          visualizacoes: number
        }
        Insert: {
          atualizado_em?: string
          cliques?: number
          criado_em?: string
          delivered_system_id?: string | null
          demand_score?: number
          id?: string
          leads_gerados?: number
          model_name?: string
          opportunity_score?: number
          portfolio_item_id?: string | null
          versao_mais_procurada?: string | null
          visualizacoes?: number
        }
        Update: {
          atualizado_em?: string
          cliques?: number
          criado_em?: string
          delivered_system_id?: string | null
          demand_score?: number
          id?: string
          leads_gerados?: number
          model_name?: string
          opportunity_score?: number
          portfolio_item_id?: string | null
          versao_mais_procurada?: string | null
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_model_performance_metrics_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_model_performance_metrics_portfolio_item_id_fkey"
            columns: ["portfolio_item_id"]
            isOneToOne: true
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_modules: {
        Row: {
          atualizado_em: string
          criado_em: string
          delivered_system_id: string | null
          descricao: string | null
          id: string
          nome: string
          observacoes: string | null
          prioridade: string | null
          progresso: number | null
          project_id: string | null
          responsavel: string | null
          status: string
          tipo: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          delivered_system_id?: string | null
          descricao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          prioridade?: string | null
          progresso?: number | null
          project_id?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          delivered_system_id?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          prioridade?: string | null
          progresso?: number | null
          project_id?: string | null
          responsavel?: string | null
          status?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_modules_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_profitability_metrics: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          custo_entrega: number | null
          custo_suporte: number | null
          delivered_system_id: string | null
          demand_score: number | null
          flags: string[] | null
          id: string
          margem_estimada: number | null
          notas: string | null
          opportunity_score: number | null
          override_manual: boolean | null
          profitability_score: number | null
          receita_manutencao: number | null
          receita_recorrente: number | null
          receita_setup: number | null
          receita_total: number | null
          recurrence_score: number | null
          reuse_score: number | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          custo_entrega?: number | null
          custo_suporte?: number | null
          delivered_system_id?: string | null
          demand_score?: number | null
          flags?: string[] | null
          id?: string
          margem_estimada?: number | null
          notas?: string | null
          opportunity_score?: number | null
          override_manual?: boolean | null
          profitability_score?: number | null
          receita_manutencao?: number | null
          receita_recorrente?: number | null
          receita_setup?: number | null
          receita_total?: number | null
          recurrence_score?: number | null
          reuse_score?: number | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          custo_entrega?: number | null
          custo_suporte?: number | null
          delivered_system_id?: string | null
          demand_score?: number | null
          flags?: string[] | null
          id?: string
          margem_estimada?: number | null
          notas?: string | null
          opportunity_score?: number | null
          override_manual?: boolean | null
          profitability_score?: number | null
          receita_manutencao?: number | null
          receita_recorrente?: number | null
          receita_setup?: number | null
          receita_total?: number | null
          recurrence_score?: number | null
          reuse_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_profitability_metrics_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: true
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          atualizado_em: string
          cliente: string
          criado_em: string
          data_conclusao: string | null
          data_inicio: string | null
          data_previsao: string | null
          delivered_system_id: string | null
          descricao: string | null
          empresa_cliente: string | null
          id: string
          nicho: string | null
          nome: string
          observacoes: string | null
          prioridade: string
          progresso: number | null
          proposta_id: string | null
          recorrencia_mensal: number | null
          responsavel: string | null
          stack: string[] | null
          status: string
          tipo_projeto: string | null
          valor_contrato: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente?: string
          criado_em?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          data_previsao?: string | null
          delivered_system_id?: string | null
          descricao?: string | null
          empresa_cliente?: string | null
          id?: string
          nicho?: string | null
          nome: string
          observacoes?: string | null
          prioridade?: string
          progresso?: number | null
          proposta_id?: string | null
          recorrencia_mensal?: number | null
          responsavel?: string | null
          stack?: string[] | null
          status?: string
          tipo_projeto?: string | null
          valor_contrato?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente?: string
          criado_em?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          data_previsao?: string | null
          delivered_system_id?: string | null
          descricao?: string | null
          empresa_cliente?: string | null
          id?: string
          nicho?: string | null
          nome?: string
          observacoes?: string | null
          prioridade?: string
          progresso?: number | null
          proposta_id?: string | null
          recorrencia_mensal?: number | null
          responsavel?: string | null
          stack?: string[] | null
          status?: string
          tipo_projeto?: string | null
          valor_contrato?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_delivered_system_id_fkey"
            columns: ["delivered_system_id"]
            isOneToOne: false
            referencedRelation: "delivered_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_proposta_id_fkey"
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
