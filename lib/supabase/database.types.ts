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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'customer' | 'admin'
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
