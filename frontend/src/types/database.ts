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
        }
        Update: {
          display_name?: string
          legal_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_creator?: boolean
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
        }
        Update: {
          title?: string
          description?: string | null
          category?: string | null
          technique?: string | null
          media_url?: string | null
          status?: WorkStatus
        }
      }
      work_commerce: {
        Row: {
          id: string
          work_id: string
          initial_price: number | null
          currency: string
          royalty_type: RoyaltyType
          royalty_value: number
          is_for_sale: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          work_id: string
          initial_price?: number | null
          currency?: string
          royalty_type?: RoyaltyType
          royalty_value?: number
          is_for_sale?: boolean
        }
        Update: {
          initial_price?: number | null
          royalty_type?: RoyaltyType
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
    }
  }
}

// Tipos extendidos para uso en la app
export interface Profile extends Database['public']['Tables']['profiles']['Row'] {}
export interface Work extends Database['public']['Tables']['works']['Row'] {}
export interface WorkCommerce extends Database['public']['Tables']['work_commerce']['Row'] {}
export interface WorkContext extends Database['public']['Tables']['work_context']['Row'] {}
export interface Transfer extends Database['public']['Tables']['transfers']['Row'] {}
export interface Certificate extends Database['public']['Tables']['certificates']['Row'] {}
export interface Alert extends Database['public']['Tables']['alerts']['Row'] {}

// Tipo para obra con relaciones
export interface WorkWithRelations extends Work {
  creator?: Profile
  current_owner?: Profile
  work_commerce?: WorkCommerce
  work_context?: WorkContext
  certificates?: Certificate[]
  transfers?: Transfer[]
}
