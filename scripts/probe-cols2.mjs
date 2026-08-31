#!/usr/bin/env node
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

try {
  const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of envText.split('\n')) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/)
    if (m) {
      const k = m[1].trim()
      let v = m[2].trim().replace(/\r$/, '')
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!process.env[k]) process.env[k] = v
    }
  }
} catch {}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false } })

// Probe individual columns on (possibly empty) tables
const checks = {
  deposit_requests: ['id','user_id','amount','currency','payment_method','reference_number','screenshot_url','notes','status','admin_id','rejection_reason','created_at','updated_at'],
  orders: ['id','order_number','user_id','status','total','currency','payment_method','delivery_status','notes','created_at','updated_at','delivery_data','delivered_at','fulfilled_by','admin_notes'],
  wallets: ['id','user_id','balance','currency','is_frozen'],
  wallet_transactions: ['id','user_id','wallet_id','type','amount','balance_before','balance_after','reference','description','status'],
  notifications: ['id','user_id','type','title','message','reference_id','is_read'],
}

for (const [table, cols] of Object.entries(checks)) {
  const missing = []
  for (const c of cols) {
    const { error } = await sb.from(table).select(c).limit(1)
    if (error) missing.push(c)
  }
  console.log(`${table}: ${missing.length ? 'MISSING ' + missing.join(', ') : 'all columns OK'}`)
}

// Also: what products exist (status check) — are the 5 DB products active?
const { data: prods } = await sb.from('products').select('id,name,slug,status,is_featured,is_popular,stock,price,category_id,images').limit(10)
console.log('PRODUCTS:', JSON.stringify(prods, null, 1))
const { data: cats } = await sb.from('categories').select('id,name,slug,sort_order').order('sort_order')
console.log('CATEGORIES:', JSON.stringify(cats))
const { data: vars } = await sb.from('product_variants').select('id,product_id,name,duration_days,price,stock').limit(10)
console.log('VARIANTS:', JSON.stringify(vars))