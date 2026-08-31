#!/usr/bin/env node
// scripts/reset-db.mjs — wipe all app data and re-seed via Supabase JS (service_role)
// No supabase CLI / no DATABASE_URL needed. Uses service_role to bypass RLS.
// Usage: node scripts/reset-db.mjs --yes

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnv(p) {
  const txt = fs.readFileSync(p, 'utf8')
  for (const line of txt.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

const envPaths = [path.resolve('digital-store/.env.local'), path.resolve('.env.local'), path.resolve('C:/Users/louzd/Documents/Visual studio code/Python/Test/Web site for sell/.worktrees/work/digital-store/.env.local')]
for (const p of envPaths) if (fs.existsSync(p)) { loadEnv(p); break }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) { console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const args = process.argv.slice(2)
if (!args.includes('--yes')) {
  console.log('⚠️  This will DELETE all categories/products/variants/orders/inventory/etc.')
  console.log('   Re-run with --yes to confirm: node scripts/reset-db.mjs --yes')
  process.exit(0)
}

async function wipe(table, label) {
  const { error, count } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) console.error(`  ❌ ${label} (${table}): ${error.message}`)
  else console.log(`  ✅ wiped ${label} (${table})`)
}

async function main() {
  console.log('🗑️  Wiping app data (FK order)...')
  // children first
  await wipe('subscriptions', 'subscriptions')
  await wipe('order_items', 'order_items')
  await wipe('orders', 'orders')
  await wipe('inventory_items', 'inventory_items')
  await wipe('coupon_usages', 'coupon_usages')
  await wipe('favorites', 'favorites')
  await wipe('notifications', 'notifications')
  await wipe('admin_logs', 'admin_logs')
  await wipe('wallet_transactions', 'wallet_transactions')
  await wipe('deposit_requests', 'deposit_requests')
  await wipe('product_variants', 'product_variants')
  await wipe('products', 'products')
  await wipe('coupons', 'coupons')
  await wipe('categories', 'categories')
  // keep wallets/profiles handled by reset-users.mjs, but optionally clear transactions etc already done
  // store_settings + deposit_methods
  await wipe('store_settings', 'store_settings')
  await wipe('deposit_methods', 'deposit_methods')

  console.log('\n🌱 Seeding fresh data...')

  // 2.1 store_settings
  const { error: sErr } = await supabase.from('store_settings').insert([
    { key: 'store_name', value: 'Digital Store' },
    { key: 'store_description', value: 'Premium digital products marketplace' },
    { key: 'default_currency', value: 'DZD' },
    { key: 'default_language', value: 'ar' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'contact_email', value: 'contact@digitalstore.dz' },
    { key: 'support_hours', value: '09:00 - 22:00' },
  ])
  if (sErr) console.error('  store_settings:', sErr.message); else console.log('  ✅ store_settings')

  const { error: dErr } = await supabase.from('deposit_methods').insert([
    { name: 'CCP (Post Office)', code: 'ccp', description: 'Payment via Algerian Post Office check', sort_order: 1 },
    { name: 'BaridiMob', code: 'baridimob', description: 'Mobile payment via Algerian Post Office', sort_order: 2 },
    { name: 'Bank Transfer', code: 'bank_transfer', description: 'Direct bank transfer', sort_order: 3 },
    { name: 'Cryptocurrency', code: 'crypto', description: 'Bitcoin, USDT, and other cryptocurrencies', sort_order: 4 },
    { name: 'Manual Payment', code: 'manual', description: 'Pay directly when collecting', sort_order: 5 },
  ])
  if (dErr) console.error('  deposit_methods:', dErr.message); else console.log('  ✅ deposit_methods')

  // 2.3 categories
  const cats = [
    { name: 'Streaming & OTT', slug: 'streaming', description: 'Streaming subscriptions: Netflix, Amazon, Disney+', sort_order: 1 },
    { name: 'IPTV', slug: 'iptv', description: 'IPTV packages with sports, VOD, EPG', sort_order: 2 },
    { name: 'Software', slug: 'software', description: 'Software licenses: Office, Adobe, Antivirus, OS', sort_order: 3 },
    { name: 'Game Keys', slug: 'game-keys', description: 'Game activation keys: Steam, PlayStation, Xbox', sort_order: 4 },
    { name: 'Gift Cards', slug: 'gift-cards', description: 'Digital gift cards', sort_order: 5 },
    { name: 'VPN & Privacy', slug: 'vpn', description: 'VPN and privacy services', sort_order: 6 },
    { name: 'AI Tools', slug: 'ai-tools', description: 'AI tools', sort_order: 7 },
    { name: 'Digital Accounts', slug: 'digital-accounts', description: 'Ready-made platform accounts', sort_order: 8 },
  ]
  const { data: catData, error: cErr } = await supabase.from('categories').insert(cats).select('id, slug')
  if (cErr) { console.error('  categories:', cErr.message); process.exit(1) }
  console.log(`  ✅ categories: ${catData.length}`)
  const catBySlug = Object.fromEntries(catData.map(c => [c.slug, c.id]))

  // helper to insert product and return id
  async function addProduct(row) {
    const { data, error } = await supabase.from('products').insert(row).select('id').single()
    if (error) { console.error(`  ❌ product ${row.slug}: ${error.message}`); return null }
    console.log(`  ✅ product ${row.slug}`)
    return data.id
  }

  const prodNetflix = await addProduct({
    name: 'Netflix Premium', slug: 'netflix-premium',
    description: 'Premium Netflix account with 4K UHD on 4 devices. Instant delivery.',
    short_description: '4K on 4 devices',
    category_id: catBySlug['streaming'],
    images: ['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=400&fit=crop'],
    price: 0, compare_at_price: null, currency: 'DZD', stock: 0, sku: 'NETFLIX-P', status: 'active', is_featured: true, is_popular: true,
    tags: ['netflix','streaming','4K'], product_type: 'subscription', delivery_type: 'automatic', subscription_duration_days: 30,
    instructions: 'Credentials delivered instantly. Do not change password.'
  })
  const prodIptv = await addProduct({
    name: 'IPTV Premium — Global Channels', slug: 'iptv-premium',
    description: '10,000+ global channels, VOD, EPG. Xtream Codes + M3U. 24h support.',
    short_description: '10k+ sports & movies',
    category_id: catBySlug['iptv'],
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=600&h=400&fit=crop'],
    price: 0, compare_at_price: null, currency: 'DZD', stock: 0, sku: 'IPTV-PREM', status: 'active', is_featured: true, is_popular: true,
    tags: ['iptv','xtream','m3u'], product_type: 'iptv', delivery_type: 'automatic', subscription_duration_days: 30,
    instructions: 'M3U and Xtream Codes sent within minutes.'
  })
  const prodWin = await addProduct({
    name: 'Windows 11 Pro — Lifetime', slug: 'windows-11-pro-lifetime',
    description: 'Genuine Windows 11 Pro activation key. Lifetime license.',
    short_description: 'Lifetime license',
    category_id: catBySlug['software'],
    images: ['https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&h=400&fit=crop'],
    price: 2500, compare_at_price: 4000, currency: 'DZD', stock: 150, sku: 'WIN11PRO-L', status: 'active', is_featured: true, is_popular: true,
    tags: ['windows','microsoft'], product_type: 'digital_key', delivery_type: 'automatic'
  })
  const prodOffice = await addProduct({
    name: 'Microsoft Office 365 Family', slug: 'office-365-family',
    description: 'Office 365 Family — 6 devices, Word, Excel, PowerPoint, OneDrive 1TB.',
    short_description: '6 devices · 1TB cloud',
    category_id: catBySlug['software'],
    images: ['https://images.unsplash.com/photo-1542281788-513404313145?w=600&h=400&fit=crop'],
    price: 3500, compare_at_price: 5000, currency: 'DZD', stock: 80, sku: 'OFFICE365-FAM', status: 'active', is_featured: true,
    tags: ['office','microsoft'], product_type: 'subscription', delivery_type: 'automatic', subscription_duration_days: 365
  })
  const prodSteam = await addProduct({
    name: 'Steam Gift Card 50 EUR', slug: 'steam-gift-card-50-eur',
    description: 'Steam gift code worth 50 EUR to top up your account.',
    short_description: '50 EUR · worldwide',
    category_id: catBySlug['gift-cards'],
    images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=400&fit=crop'],
    price: 7500, compare_at_price: 8500, currency: 'DZD', stock: 30, sku: 'STEAM-50EUR', status: 'active', is_popular: true,
    tags: ['steam','gift'], product_type: 'gift_card', delivery_type: 'automatic'
  })
  const prodVpn = await addProduct({
    name: 'ExpressVPN — 1 Year', slug: 'expressvpn-1-year',
    description: 'ExpressVPN 12 months. 105 countries, AES-256 encryption.',
    short_description: '12 months · 105 countries',
    category_id: catBySlug['vpn'],
    images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop'],
    price: 0, currency: 'DZD', stock: 0, sku: 'EXPRESSVPN-1Y', status: 'active', is_featured: true, is_popular: true,
    tags: ['vpn','privacy'], product_type: 'subscription', delivery_type: 'automatic', subscription_duration_days: 365
  })
  const prodAny = await addProduct({
    name: 'AnyDesk Pro — 1 Year', slug: 'anydesk-pro-year',
    description: 'AnyDesk Pro license for 1 device for 1 year.',
    short_description: '1 device · 1 year',
    category_id: catBySlug['software'],
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop'],
    price: 2200, compare_at_price: 3500, currency: 'DZD', stock: 70, sku: 'ANYDESK-PRO-1Y', status: 'active', is_popular: true,
    tags: ['anydesk','remote'], product_type: 'subscription', delivery_type: 'automatic', subscription_duration_days: 365
  })
  const prodMid = await addProduct({
    name: 'MidJourney Pro — 12 Months', slug: 'midjourney-pro-12m',
    description: 'MidJourney Pro account 12 months. 4K images, Discord VIP.',
    short_description: '4K images · Discord VIP',
    category_id: catBySlug['ai-tools'],
    images: ['https://images.unsplash.com/photo-1620641788421-7a1c342ead82?w=600&h=400&fit=crop'],
    price: 6000, compare_at_price: 9000, currency: 'DZD', stock: 30, sku: 'MIDJ-P-12M', status: 'active', is_featured: true, is_popular: true,
    tags: ['midjourney','ai'], product_type: 'subscription', delivery_type: 'automatic', subscription_duration_days: 365
  })

  // variants (only for variant-based products; price=0 products hide base price/stock on product page per your earlier fix)
  async function addVariants(productId, vars) {
    if (!productId) return
    const rows = vars.map((v, i) => ({ product_id: productId, name: v.name, duration_days: v.days, price: v.price, compare_at_price: v.compare ?? null, stock: v.stock, sku: v.sku, sort_order: i + 1 }))
    const { error } = await supabase.from('product_variants').insert(rows)
    if (error) console.error('  variants:', error.message); else console.log(`  ✅ variants for ${productId.slice(0,8)}: ${rows.length}`)
  }
  await addVariants(prodNetflix, [
    { name: '1 Month', days: 30, price: 1200, compare: 1500, stock: 25, sku: 'NETFLIX-1M' },
    { name: '3 Months', days: 90, price: 3200, compare: 4000, stock: 18, sku: 'NETFLIX-3M' },
    { name: '12 Months', days: 365, price: 11000, compare: 14000, stock: 10, sku: 'NETFLIX-12M' },
  ])
  await addVariants(prodIptv, [
    { name: '1 Month', days: 30, price: 1200, stock: 12, sku: 'IPTV-1M' },
    { name: '3 Months', days: 90, price: 3000, stock: 8, sku: 'IPTV-3M' },
    { name: '12 Months', days: 365, price: 4500, stock: 5, sku: 'IPTV-12M' },
  ])
  await addVariants(prodVpn, [
    { name: '1 Month', days: 30, price: 800, stock: 20, sku: 'EXPR-VPN-1M' },
    { name: '12 Months', days: 365, price: 4000, stock: 10, sku: 'EXPR-VPN-1Y' },
  ])

  // inventory for key-based products
  if (prodWin) {
    const rows = Array.from({ length: 15 }, (_, i) => ({
      product_id: prodWin, product_data: { key: `XXXXX-XXXXX-XXXXX-XXXXX-${String(i+1).padStart(5,'0')}` }, status: 'available'
    }))
    const { error } = await supabase.from('inventory_items').insert(rows)
    if (error) console.error('  inventory win:', error.message); else console.log('  ✅ inventory Windows: 15')
  }
  if (prodOffice) {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      product_id: prodOffice, product_data: { license: `OFFICE365-FAM-${String(i+1).padStart(4,'0')}`, email: `license${i+1}@digitalstore.dz` }, status: 'available'
    }))
    const { error } = await supabase.from('inventory_items').insert(rows)
    if (error) console.error('  inventory office:', error.message); else console.log('  ✅ inventory Office: 10')
  }

  // final counts
  const [catsC, prodsC, varsC, invC] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('product_variants').select('id', { count: 'exact', head: true }),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
  ])
  console.log('\n✅ Done!')
  console.log(`📊 categories: ${catsC.count} | products: ${prodsC.count} | variants: ${varsC.count} | inventory: ${invC.count}`)
  console.log('\nYour product page fix (hide base price/stock when variants exist) is still active and will apply to Netflix/IPTV/VPN.')
}

main().catch(e => { console.error('💥', e); process.exit(1) })
