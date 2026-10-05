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
          phone: string | null
          role: 'customer' | 'admin'
          staff_role_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          staff_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          staff_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          full_name: string
          phone: string
          address: string
          city: string
          state: string
          pincode: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          full_name: string
          phone: string
          address: string
          city: string
          state: string
          pincode: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          full_name?: string
          phone?: string
          address?: string
          city?: string
          state?: string
          pincode?: string
          is_default?: boolean
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
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
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
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          paid_at: string | null
          refunded_amount: number
          tracking_token: string | null
          stock_reserved: boolean
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
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
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
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          paid_at?: string | null
          refunded_amount?: number
          tracking_token?: string | null
          stock_reserved?: boolean
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
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
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
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          paid_at?: string | null
          refunded_amount?: number
          tracking_token?: string | null
          stock_reserved?: boolean
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
      video_appointments: {
        Row: {
          id: string
          customer_name: string
          email: string
          phone: string
          topic: string
          message: string | null
          scheduled_at: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          meet_link: string | null
          zoom_meeting_id: string | null
          zoom_passcode: string | null
          admin_notes: string | null
          confirmed_at: string | null
          reminder_1d_sent_at: string | null
          reminder_30m_sent_at: string | null
          followup_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          email: string
          phone: string
          topic?: string
          message?: string | null
          scheduled_at: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          meet_link?: string | null
          zoom_meeting_id?: string | null
          zoom_passcode?: string | null
          admin_notes?: string | null
          confirmed_at?: string | null
          reminder_1d_sent_at?: string | null
          reminder_30m_sent_at?: string | null
          followup_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          email?: string
          phone?: string
          topic?: string
          message?: string | null
          scheduled_at?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          meet_link?: string | null
          zoom_meeting_id?: string | null
          zoom_passcode?: string | null
          admin_notes?: string | null
          confirmed_at?: string | null
          reminder_1d_sent_at?: string | null
          reminder_30m_sent_at?: string | null
          followup_sent_at?: string | null
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
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_booked_slots: {
        Args: { range_start: string; range_end: string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
