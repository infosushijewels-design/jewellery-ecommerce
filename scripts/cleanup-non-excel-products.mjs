#!/usr/bin/env node
/**
 * One-time cleanup: removes every `products` row that is NOT a legitimate item from
 * docs/Sushi_Jewels_Product_Data.xlsx (sheet "Sushi_Jewels_Product_Data_All_F").
 *
 * A product is considered stale/dummy when:
 *   - its `sku` is null/empty, OR
 *   - its `sku` doesn't match any SKU present in the Excel sheet, OR
 *   - its `title` contains "(Copy)" (duplicate-button artifacts from the admin panel)
 *
 * SAFETY: this is a DESTRUCTIVE, irreversible operation against the live database.
 *   - Default run = DRY RUN ONLY. It prints exactly what would be deleted and changes nothing.
 *   - Pass --execute to actually perform the deletion.
 *
 * Usage:
 *   node scripts/cleanup-non-excel-products.mjs            # dry run (safe, default)
 *   node scripts/cleanup-non-excel-products.mjs --execute   # actually deletes
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import XLSXModule from 'xlsx';
// The xlsx package's ESM named exports don't include readFile/utils at the top level
// (they only exist on the default export) — use that directly.
const XLSX = XLSXModule.default ?? XLSXModule;
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const EXECUTE = process.argv.includes('--execute');
const EXCEL_PATH = path.join(ROOT, 'docs', 'Sushi_Jewels_Product_Data.xlsx');
const SHEET_NAME = 'Sushi_Jewels_Product_Data_All_F';

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function loadValidSkus() {
  const workbook = XLSX.readFile(EXCEL_PATH);
  if (!workbook.SheetNames.includes(SHEET_NAME)) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
  }
  const worksheet = workbook.Sheets[SHEET_NAME];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const skuSet = new Set();
  for (const row of rows) {
    const sku = String(row['SKU'] ?? '').trim();
    if (sku) skuSet.add(sku);
  }
  return { skuSet, totalRows: rows.length };
}

function isStale(product, validSkuSet) {
  const sku = (product.sku ?? '').trim();
  if (!sku) return { stale: true, reason: 'missing SKU' };
  if (!validSkuSet.has(sku)) return { stale: true, reason: `SKU "${sku}" not in Excel sheet` };
  if (/\(copy\)/i.test(product.title || '')) return { stale: true, reason: 'duplicate "(Copy)" title' };
  return { stale: false, reason: null };
}

async function main() {
  console.log(EXECUTE ? '⚠️  EXECUTE MODE — this WILL delete rows.\n' : '🔍 DRY RUN — no data will be changed.\n');

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY missing from .env.local');
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { skuSet, totalRows } = loadValidSkus();
  console.log(`📄 Excel sheet "${SHEET_NAME}": ${totalRows} total rows, ${skuSet.size} unique valid SKUs.\n`);

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, sku, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to read products: ${error.message}`);

  const stale = [];
  const keep = [];
  for (const p of products) {
    const result = isStale(p, skuSet);
    if (result.stale) stale.push({ ...p, reason: result.reason });
    else keep.push(p);
  }

  console.log(`📦 products table: ${products.length} total rows.`);
  console.log(`✅ Will KEEP:   ${keep.length} products (valid Excel SKU, no "(Copy)" title).`);
  console.log(`🗑️  Will DELETE: ${stale.length} products:\n`);

  for (const p of stale) {
    console.log(`   - [${p.sku || 'NO SKU'}] "${p.title}" — ${p.reason}`);
  }

  if (!EXECUTE) {
    console.log('\n🔍 Dry run complete. Re-run with --execute to actually delete these rows.');
    return;
  }

  if (stale.length === 0) {
    console.log('\nNothing to delete.');
    return;
  }

  const staleIds = stale.map((p) => p.id);

  console.log('\n🗑️  Deleting dependent rows first...');
  const { error: variantsError, count: variantsCount } = await supabase
    .from('product_variants')
    .delete({ count: 'exact' })
    .in('product_id', staleIds);
  if (variantsError) throw new Error(`Failed deleting product_variants: ${variantsError.message}`);
  console.log(`   product_variants: ${variantsCount ?? 0} removed`);

  const { error: wishlistError, count: wishlistCount } = await supabase
    .from('wishlist_items')
    .delete({ count: 'exact' })
    .in('product_id', staleIds);
  if (wishlistError) throw new Error(`Failed deleting wishlist_items: ${wishlistError.message}`);
  console.log(`   wishlist_items: ${wishlistCount ?? 0} removed`);

  const { error: reviewsError, count: reviewsCount } = await supabase
    .from('product_reviews')
    .delete({ count: 'exact' })
    .in('product_id', staleIds);
  if (reviewsError) throw new Error(`Failed deleting product_reviews: ${reviewsError.message}`);
  console.log(`   product_reviews: ${reviewsCount ?? 0} removed`);

  // order_items.product_id is ON DELETE SET NULL — deliberately left untouched so real
  // order history is preserved; it will just lose its product link, which Postgres handles.

  console.log('\n🗑️  Deleting products...');
  const { error: deleteError, count: deletedCount } = await supabase
    .from('products')
    .delete({ count: 'exact' })
    .in('id', staleIds);
  if (deleteError) throw new Error(`Failed deleting products: ${deleteError.message}`);
  console.log(`   products: ${deletedCount ?? 0} removed`);

  const { count: finalCount, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
  if (countError) throw new Error(`Failed to verify final count: ${countError.message}`);

  console.log(`\n✅ Done. Final products table count: ${finalCount} (Excel sheet has ${skuSet.size} unique valid SKUs).`);
}

main().catch((err) => {
  console.error('\n❌ Script failed:', err.message);
  process.exit(1);
});
