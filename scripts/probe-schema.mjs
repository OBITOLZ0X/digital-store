#!/usr/bin/env node
// Probe which tables exist in the live Supabase database
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Missing env'); process.exit(1) }

const sb = createClient(url, key, { auth: { autoRefreshToken: false } })

const tables = [
  'profiles','products','product_variants','variants','inventory_items',
  'orders','order_items','wallets','wallet_transactions','deposit_requests',
  'deposit_methods','categories','subscriptions','coupons','coupon_usages',
  'favorites','notifications','admin_logs','store_settings'
]

for (const t of tables) {
  const { data, error } = await sb.from(t).select('*', { head: true, count: 'exact' })
  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202') {
      console.log(`${t}: MISSING`)
    } else {
      console.log(`${t}: ERROR ${error.code || ''} ${error.message.slice(0, 80)}`)
    }
  } else {
    console.log(`${t}: OK`)
  }
}

// Also check execute_transaction RPC exists by querying pg_proc via a harmless rpc error probe
const { error: rpcErr } = await sb.rpc('execute_transaction', {
  p_user_id: '00000000-0000-0000-0000-000000000000',
  p_wallet_id: '00000000-0000-0000-0000-000000000000',
  p_amount: 0, p_type: 'purchase', p_reference: 'probe', p_description: 'probe'
})
if (rpcErr) console.log(`execute_transaction RPC: ${rpcErr.code || ''} ${rpcErr.message.slice(0, 100)}`)
else console.log('execute_transaction RPC: OK')
