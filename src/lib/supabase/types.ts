// Database types - auto-generated style, manually maintained
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'customer' | 'admin' | 'super_admin'
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin' | 'super_admin'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'admin' | 'super_admin'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          currency: string
          is_frozen: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          balance?: number
          currency?: string
          is_frozen?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          currency?: string
          is_frozen?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          type: 'deposit' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit' | 'adjustment'
          amount: number
          balance_before: number
          balance_after: number
          reference: string | null
          description: string | null
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          wallet_id: string
          type: 'deposit' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit' | 'adjustment'
          amount: number
          balance_before: number
          balance_after: number
          reference?: string | null
          description?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          type?: 'deposit' | 'purchase' | 'refund' | 'admin_credit' | 'admin_debit' | 'adjustment'
          amount?: number
          balance_before?: number
          balance_after?: number
          reference?: string | null
          description?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
      }
      deposit_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          payment_method: string
          reference_number: string | null
          screenshot_url: string | null
          notes: string | null
          status: 'pending' | 'approved' | 'rejected'
          admin_id: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          amount: number
          currency?: string
          payment_method: string
          reference_number?: string | null
          screenshot_url?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_id?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          currency?: string
          payment_method?: string
          reference_number?: string | null
          screenshot_url?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_id?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          category_id: string | null
          images: string[]
          price: number
          compare_at_price: number | null
          currency: string
          stock: number
          sku: string | null
          status: 'draft' | 'active' | 'hidden' | 'archived'
          is_featured: boolean
          is_popular: boolean
          tags: string[]
          product_type: 'digital_key' | 'digital_account' | 'subscription' | 'iptv' | 'gift_card' | 'manual_delivery'
          delivery_type: 'automatic' | 'manual'
          subscription_duration_days: number | null
          expiration_days: number | null
          terms: string | null
          instructions: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          category_id?: string | null
          images?: string[]
          price: number
          compare_at_price?: number | null
          currency?: string
          stock?: number
          sku?: string | null
          status?: 'draft' | 'active' | 'hidden' | 'archived'
          is_featured?: boolean
          is_popular?: boolean
          tags?: string[]
          product_type?: 'digital_key' | 'digital_account' | 'subscription' | 'iptv' | 'gift_card' | 'manual_delivery'
          delivery_type?: 'automatic' | 'manual'
          subscription_duration_days?: number | null
          expiration_days?: number | null
          terms?: string | null
          instructions?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          category_id?: string | null
          images?: string[]
          price?: number
          compare_at_price?: number | null
          currency?: string
          stock?: number
          sku?: string | null
          status?: 'draft' | 'active' | 'hidden' | 'archived'
          is_featured?: boolean
          is_popular?: boolean
          tags?: string[]
          product_type?: 'digital_key' | 'digital_account' | 'subscription' | 'iptv' | 'gift_card' | 'manual_delivery'
          delivery_type?: 'automatic' | 'manual'
          subscription_duration_days?: number | null
          expiration_days?: number | null
          terms?: string | null
          instructions?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          duration_days: number | null
          price: number
          compare_at_price: number | null
          stock: number
          sku: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          product_id: string
          name: string
          duration_days?: number | null
          price: number
          compare_at_price?: number | null
          stock?: number
          sku?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          duration_days?: number | null
          price?: number
          compare_at_price?: number | null
          stock?: number
          sku?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_id: string | null
          sort_order: number
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          slug: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          product_data: Json
          status: 'available' | 'reserved' | 'sold' | 'expired' | 'disabled'
          reserved_until: string | null
          sold_at: string | null
          order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          product_id: string
          variant_id?: string | null
          product_data: Json
          status?: 'available' | 'reserved' | 'sold' | 'expired' | 'disabled'
          reserved_until?: string | null
          sold_at?: string | null
          order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          variant_id?: string | null
          product_data?: Json
          status?: 'available' | 'reserved' | 'sold' | 'expired' | 'disabled'
          reserved_until?: string | null
          sold_at?: string | null
          order_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
          total: number
          currency: string
          payment_method: string
          delivery_status: 'pending' | 'delivered' | 'failed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          order_number: string
          user_id: string
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
          total: number
          currency?: string
          payment_method?: string
          delivery_status?: 'pending' | 'delivered' | 'failed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
          total?: number
          currency?: string
          payment_method?: string
          delivery_status?: 'pending' | 'delivered' | 'failed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          variant_name: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id: string
          order_id: string
          product_id: string
          variant_id?: string | null
          product_name: string
          variant_name?: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variant_id?: string | null
          product_name?: string
          variant_name?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          order_id: string
          status: 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'cancelled'
          start_date: string
          expiration_date: string
          auto_renew: boolean
          credentials_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          product_id: string
          variant_id?: string | null
          order_id: string
          status?: 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'cancelled'
          start_date: string
          expiration_date: string
          auto_renew?: boolean
          credentials_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          variant_id?: string | null
          order_id?: string
          status?: 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'cancelled'
          start_date?: string
          expiration_date?: string
          auto_renew?: boolean
          credentials_ref?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percentage' | 'fixed'
          discount_value: number
          min_order_amount: number | null
          max_discount: number | null
          usage_limit: number | null
          per_user_limit: number | null
          start_date: string | null
          expiration_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          code: string
          type: 'percentage' | 'fixed'
          discount_value: number
          min_order_amount?: number | null
          max_discount?: number | null
          usage_limit?: number | null
          per_user_limit?: number | null
          start_date?: string | null
          expiration_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: 'percentage' | 'fixed'
          discount_value?: number
          min_order_amount?: number | null
          max_discount?: number | null
          usage_limit?: number | null
          per_user_limit?: number | null
          start_date?: string | null
          expiration_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          used_at: string
        }
        Insert: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string
          order_id?: string
          used_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          reference_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          reference_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          reference_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id: string
          admin_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          id: string
          key: string
          value?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          updated_at?: string
        }
      }
      deposit_methods: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          code: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
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
  }
}

// Re-export common types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row']
export type DepositRequest = Database['public']['Tables']['deposit_requests']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AdminLog = Database['public']['Tables']['admin_logs']['Row']
export type StoreSetting = Database['public']['Tables']['store_settings']['Row']
export type DepositMethod = Database['public']['Tables']['deposit_methods']['Row']
