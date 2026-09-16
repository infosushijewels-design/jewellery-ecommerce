# Supabase Schema Plan

## Overview
This document outlines the database schema designed for the Sushi Jewels e-commerce platform. The schema utilizes Supabase (PostgreSQL) and focuses on the core models necessary for the product catalog.

## Tables

### `categories`
Stores product categories (e.g., Rings, Necklaces).
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `name` (text, not null)
- `slug` (text, not null, unique)
- `description` (text, nullable)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)

**Indexes:** `idx_categories_slug`

### `collections`
Stores thematic collections or anthologies (e.g., The Solitaire Collection, The Royal Anthology).
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `name` (text, not null)
- `slug` (text, not null, unique)
- `description` (text, nullable)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)

**Indexes:** `idx_collections_slug`

### `products`
Stores individual jewellery items.
- `id` (uuid, primary key, default `uuid_generate_v4()`)
- `title` (text, not null)
- `slug` (text, not null, unique)
- `description` (text, nullable)
- `price` (numeric, not null)
- `material` (text, not null) - e.g., "18K White Gold"
- `certification` (text, nullable) - e.g., "IGI Certified"
- `badge` (text, nullable) - e.g., "Bestseller", "New Arrival", "Daily Chic"
- `image_url` (text, not null)
- `category_id` (uuid, references `categories.id`)
- `collection_id` (uuid, references `collections.id`, nullable)
- `is_featured` (boolean, default false)
- `is_new_arrival` (boolean, default false)
- `created_at` (timestamptz, default `now()`)
- `updated_at` (timestamptz, default `now()`)

**Indexes:**
- `idx_products_slug`
- `idx_products_category_id`
- `idx_products_collection_id`
- `idx_products_is_new_arrival`
- `idx_products_is_featured`

## Slug Rules
- Slugs should be lowercase, alphanumeric, with spaces replaced by hyphens (`-`).
- They must be unique across their respective tables.

## Row Level Security (RLS)
- **Public Read Access**: Enabled for `categories`, `collections`, and `products`. Anyone can query these tables.
- **Write Access**: Restricted to authenticated admins only (to be implemented in a future phase; currently, no write policies are provided).
