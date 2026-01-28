export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type WorkStatus = 'draft' | 'certified' | 'transferred' | 'archived'
export type RoyaltyType = 'fixed' | 'percentage'
export type TransferType = 'automatic' | 'manual' | 'gift'
export type TransferStatus = 'pending' | 'payment_pending' | 'completed' | 'cancelled'
export type AlertType = 'plagiarism' | 'view' | 'transfer_request' | 'payment' | 'system'
export type CreatorType = 'individual' | 'group' | 'corporation'
export type OriginalityDeclaration = 'original' | 'derivative' | 'authorized_edition'
export type TBTStatus = 'draft' | 'pending_payment' | 'immutable' | 'transferred'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          display_name: string
          legal_name: string | null
          bio: string | null
          avatar_url: string | null
          is_creator: boolean
          created_at: string
          updated_at: string
          // New v2 fields
          creator_type: CreatorType | null
          legal_name_full: string | null
          collective_name: string | null
          lead_representative: string | null
          entity_name: string | null
          tax_id: string | null
          public_alias: string | null
          physical_address: Json | null
          credentials: string | null
          social_linkedin: string | null
          social_website: string | null
          social_instagram: string | null
          social_other: string[] | null
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          display_name: string
          legal_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_creator?: boolean
          creator_type?: CreatorType | null
          legal_name_full?: string | null
          collective_name?: string | null
          lead_representative?: string | null
          entity_name?: string | null
          tax_id?: string | null
          public_alias?: string | null
          physical_address?: Json | null
          credentials?: string | null
          social_linkedin?: string | null
          social_website?: string | null
          social_instagram?: string | null
          social_other?: string[] | null
        }
        Update: {
          display_name?: string
          legal_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_creator?: boolean
          creator_type?: CreatorType | null
          legal_name_full?: string | null
          collective_name?: string | null
          lead_representative?: string | null
          entity_name?: string | null
          tax_id?: string | null
          public_alias?: string | null
          physical_address?: Json | null
          credentials?: string | null
          social_linkedin?: string | null
          social_website?: string | null
          social_instagram?: string | null
          social_other?: string[] | null
        }
      }
      works: {
        Row: {
          id: string
          tbt_id: string
          creator_id: string
          current_owner_id: string
          title: string
          description: string | null
          category: string | null
          technique: string | null
          media_url: string | null
          media_type: string | null
          ipfs_hash: string | null
          status: WorkStatus
          created_at: string
          certified_at: string | null
          blockchain_hash: string | null
          // New v2 fields
          primary_material: string | null
          creation_date: string | null
          is_published: boolean
          asset_links: string[] | null
          originality_type: OriginalityDeclaration | null
          original_work_reference: string | null
          plagiarism_scan_result: Json | null
          plagiarism_scan_date: string | null
          context_data: Json | null
          context_summary: string | null
          context_signed_at: string | null
          payment_status: string | null
          payment_intent_id: string | null
          payment_completed_at: string | null
          mms_sent_at: string | null
          mms_delivery_status: string | null
        }
        Insert: {
          id?: string
          tbt_id?: string
          creator_id: string
          current_owner_id: string
          title: string
          description?: string | null
          category?: string | null
          technique?: string | null
          media_url?: string | null
          media_type?: string | null
          ipfs_hash?: string | null
          status?: WorkStatus
          primary_material?: string | null
          creation_date?: string | null
          is_published?: boolean
          asset_links?: string[] | null
          originality_type?: OriginalityDeclaration | null
          original_work_reference?: string | null
          plagiarism_scan_result?: Json | null
          plagiarism_scan_date?: string | null
          context_data?: Json | null
          context_summary?: string | null
          context_signed_at?: string | null
          payment_status?: string | null
          payment_intent_id?: string | null
          payment_completed_at?: string | null
          mms_sent_at?: string | null
          mms_delivery_status?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          category?: string | null
          technique?: string | null
          media_url?: string | null
          status?: WorkStatus
          primary_material?: string | null
          creation_date?: string | null
          is_published?: boolean
          asset_links?: string[] | null
          originality_type?: OriginalityDeclaration | null
          original_work_reference?: string | null
          plagiarism_scan_result?: Json | null
          plagiarism_scan_date?: string | null
          context_data?: Json | null
          context_summary?: string | null
          context_signed_at?: string | null
          payment_status?: string | null
          payment_intent_id?: string | null
          payment_completed_at?: string | null
          mms_sent_at?: string | null
          mms_delivery_status?: string | null
        }
      }
      work_commerce: {
        Row: {
          id: string
          work_id: string
          initial_price: number | null
          currency: string
          royalty_type: RoyaltyType | null
          royalty_value: number
          is_for_sale: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          work_id: string
          initial_price?: number | null
          currency?: string
          royalty_type?: RoyaltyType | null
          royalty_value?: number
          is_for_sale?: boolean
        }
        Update: {
          initial_price?: number | null
          royalty_type?: RoyaltyType | null
          royalty_value?: number
          is_for_sale?: boolean
        }
      }
      work_context: {
        Row: {
          id: string
          work_id: string
          ai_summary: string | null
          keywords: string[] | null
          geographical_location: Json | null
          creation_timestamp: string
          news_headlines: string[] | null
          weather_conditions: Json | null
          is_confirmed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          work_id: string
          ai_summary?: string | null
          keywords?: string[] | null
          geographical_location?: Json | null
          creation_timestamp?: string
          is_confirmed?: boolean
        }
        Update: {
          ai_summary?: string | null
          keywords?: string[] | null
          is_confirmed?: boolean
        }
      }
      transfers: {
        Row: {
          id: string
          work_id: string
          from_owner_id: string
          to_owner_id: string
          transfer_type: TransferType
          sale_price: number | null
          royalty_amount: number | null
          royalty_paid: boolean
          payment_reference: string | null
          payment_link: string | null
          notes: string | null
          status: TransferStatus
          initiated_at: string
          completed_at: string | null
        }
        Insert: {
          work_id: string
          from_owner_id: string
          to_owner_id: string
          transfer_type: TransferType
          sale_price?: number | null
          royalty_amount?: number | null
          notes?: string | null
        }
        Update: {
          status?: TransferStatus
          royalty_paid?: boolean
          payment_reference?: string | null
        }
      }
      certificates: {
        Row: {
          id: string
          work_id: string
          owner_id: string
          certificate_url: string | null
          qr_code_data: string | null
          version: number
          generated_at: string
          valid_until: string | null
        }
        Insert: {
          work_id: string
          owner_id: string
          certificate_url?: string | null
          qr_code_data?: string | null
          version?: number
        }
        Update: {
          certificate_url?: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          work_id: string | null
          type: AlertType
          title: string
          message: string | null
          metadata: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          work_id?: string | null
          type: AlertType
          title: string
          message?: string | null
          metadata?: Json | null
        }
        Update: {
          is_read?: boolean
        }
      }
      // New v2 tables
      tbt_payments: {
        Row: {
          id: string
          work_id: string
          user_id: string
          amount: number
          currency: string
          stripe_payment_intent_id: string | null
          stripe_checkout_session_id: string | null
          status: string
          created_at: string
          completed_at: string | null
          metadata: Json | null
        }
        Insert: {
          work_id: string
          user_id: string
          amount?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          status?: string
          metadata?: Json | null
        }
        Update: {
          status?: string
          completed_at?: string | null
          stripe_payment_intent_id?: string | null
        }
      }
      plagiarism_checks: {
        Row: {
          id: string
          work_id: string
          scan_type: string | null
          scan_result: Json | null
          similarity_score: number | null
          matches_found: number
          flagged_urls: string[] | null
          user_declaration: OriginalityDeclaration | null
          declaration_note: string | null
          scanned_at: string
        }
        Insert: {
          work_id: string
          scan_type?: string | null
          scan_result?: Json | null
          similarity_score?: number | null
          matches_found?: number
          flagged_urls?: string[] | null
          user_declaration?: OriginalityDeclaration | null
          declaration_note?: string | null
        }
        Update: {
          scan_result?: Json | null
          similarity_score?: number | null
          user_declaration?: OriginalityDeclaration | null
          declaration_note?: string | null
        }
      }
      context_snapshots: {
        Row: {
          id: string
          work_id: string
          gps_coordinates: Json | null
          location_name: string | null
          country: string | null
          city: string | null
          weather_data: Json | null
          top_headlines: string[] | null
          market_data: Json | null
          ai_summary: string | null
          ai_model: string | null
          user_edited_summary: string | null
          signed_at: string | null
          created_at: string
          // Expanded context fields (Phase 2)
          general_context: string | null
          contemporary_context: string | null
          elaboration_type: string | null
        }
        Insert: {
          work_id: string
          gps_coordinates?: Json | null
          location_name?: string | null
          country?: string | null
          city?: string | null
          weather_data?: Json | null
          top_headlines?: string[] | null
          market_data?: Json | null
          ai_summary?: string | null
          ai_model?: string | null
          user_edited_summary?: string | null
          signed_at?: string | null
          // Expanded context fields (Phase 2)
          general_context?: string | null
          contemporary_context?: string | null
          elaboration_type?: string | null
        }
        Update: {
          user_edited_summary?: string | null
          signed_at?: string | null
          general_context?: string | null
          contemporary_context?: string | null
          elaboration_type?: string | null
        }
      }
      mms_deliveries: {
        Row: {
          id: string
          work_id: string
          user_id: string
          phone_number: string
          twilio_message_sid: string | null
          status: string
          certificate_url: string | null
          gif_url: string | null
          sent_at: string | null
          delivered_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          work_id: string
          user_id: string
          phone_number: string
          twilio_message_sid?: string | null
          status?: string
          certificate_url?: string | null
          gif_url?: string | null
        }
        Update: {
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
        }
      }
    }
  }
}

// Tipos extendidos para uso en la app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Work = Database['public']['Tables']['works']['Row']
export type WorkCommerce = Database['public']['Tables']['work_commerce']['Row']
export type WorkContext = Database['public']['Tables']['work_context']['Row']
export type Transfer = Database['public']['Tables']['transfers']['Row']
export type Certificate = Database['public']['Tables']['certificates']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type TBTPayment = Database['public']['Tables']['tbt_payments']['Row']
export type PlagiarismCheck = Database['public']['Tables']['plagiarism_checks']['Row']
export type ContextSnapshot = Database['public']['Tables']['context_snapshots']['Row']
export type MMSDelivery = Database['public']['Tables']['mms_deliveries']['Row']

// Tipo para obra con relaciones
export type WorkWithRelations = Work & {
  creator?: Profile
  current_owner?: Profile
  work_commerce?: WorkCommerce
  work_context?: WorkContext
  context_snapshot?: ContextSnapshot
  certificates?: Certificate[]
  transfers?: Transfer[]
  payments?: TBTPayment[]
  plagiarism_checks?: PlagiarismCheck[]
  mms_deliveries?: MMSDelivery[]
}
