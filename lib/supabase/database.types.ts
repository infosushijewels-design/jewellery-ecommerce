export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          slug: string
          sku: string | null
          description: string | null
          price: number
          mrp: number | null
          stock: number
          material: string
          certification: string | null
          badge: string | null
          image_url: string
          gallery_images: string[]
          available_sizes: string[]
          category_id: string | null
          collection_id: string | null
          is_featured: boolean
          is_new_arrival: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          sku?: string | null
          description?: string | null
          price: number
          mrp?: number | null
          stock?: number
          material: string
          certification?: string | null
          badge?: string | null
          image_url: string
          gallery_images?: string[]
          available_sizes?: string[]
          category_id?: string | null
          collection_id?: string | null
          is_featured?: boolean
          is_new_arrival?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          sku?: string | null
          description?: string | null
          price?: number
          mrp?: number | null
          stock?: number
          material?: string
          certification?: string | null
          badge?: string | null
          image_url?: string
          gallery_images?: string[]
          available_sizes?: string[]
          category_id?: string | null
          collection_id?: string | null
          is_featured?: boolean
          is_new_arrival?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string | null
          karat: string | null
          metal_color: string | null
          weight: number | null
          price: number | null
          stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku?: string | null
          karat?: string | null
          metal_color?: string | null
          weight?: number | null
          price?: number | null
          stock?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string | null
          karat?: string | null
          metal_color?: string | null
          weight?: number | null
          price?: number | null
          stock?: number
          created_at?: string
          updated_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'customer' | 'admin'
          staff_role_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'customer' | 'admin'
          staff_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'customer' | 'admin'
          staff_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          status: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal: number
          tax: number
          shipping_fee: number
          total: number
          payment_method: 'cod' | 'online'
          payment_status: 'pending' | 'paid' | 'failed'
          shipping_address: {
            full_name: string
            email: string
            phone: string
            address: string
            city: string
            state: string
            pincode: string
          }
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id?: string | null
          status?: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal: number
          tax: number
          shipping_fee?: number
          total: number
          payment_method?: 'cod' | 'online'
          payment_status?: 'pending' | 'paid' | 'failed'
          shipping_address: {
            full_name: string
            email: string
            phone: string
            address: string
            city: string
            state: string
            pincode: string
          }
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          status?: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal?: number
          tax?: number
          shipping_fee?: number
          total?: number
          payment_method?: 'cod' | 'online'
          payment_status?: 'pending' | 'paid' | 'failed'
          shipping_address?: {
            full_name: string
            email: string
            phone: string
            address: string
            city: string
            state: string
            pincode: string
          }
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          title: string
          image_url: string | null
          price: number
          quantity: number
          metal: string | null
          size: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          title: string
          image_url?: string | null
          price: number
          quantity: number
          metal?: string | null
          size?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          title?: string
          image_url?: string | null
          price?: number
          quantity?: number
          metal?: string | null
          size?: string | null
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'percent' | 'fixed'
          discount_value: number
          min_order_amount: number
          max_discount: number | null
          usage_limit: number | null
          used_count: number
          starts_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: 'percent' | 'fixed'
          discount_value: number
          min_order_amount?: number
          max_discount?: number | null
          usage_limit?: number | null
          used_count?: number
          starts_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'percent' | 'fixed'
          discount_value?: number
          min_order_amount?: number
          max_discount?: number | null
          usage_limit?: number | null
          used_count?: number
          starts_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          reviewer_name: string
          reviewer_email: string | null
          rating: number
          title: string | null
          comment: string | null
          status: 'pending' | 'approved' | 'rejected'
          admin_reply: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          reviewer_name: string
          reviewer_email?: string | null
          rating: number
          title?: string | null
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          reviewer_name?: string
          reviewer_email?: string | null
          rating?: number
          title?: string | null
          comment?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_inquiries: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          category: string | null
          message: string
          status: 'new' | 'in_progress' | 'resolved'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          category?: string | null
          message: string
          status?: 'new' | 'in_progress' | 'resolved'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          category?: string | null
          message?: string
          status?: 'new' | 'in_progress' | 'resolved'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      legal_pages: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          content: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          summary?: string | null
          content?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          summary?: string | null
          content?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff_roles: {
        Row: {
          id: string
          name: string
          description: string | null
          permissions: Json
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      store_settings: {
        Row: {
          id: number
          settings: Json
          updated_at: string
        }
        Insert: {
          id?: number
          settings?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          settings?: Json
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
