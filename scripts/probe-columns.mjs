#!/usr/bin/env node
// Probe actual columns of key tables
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

const tables = ['products','product_variants','variants','inventory_items','deposit_requests','orders','order_items','categories']
for (const t of tables) {
  const { data, error } = await sb.from(t).select('*').limit(1)
  if (error) { console.log(`${t}: ERR ${error.message.slice(0,60)}`); continue }
  const cols = data && data.length ? Object.keys(data[0]) : '(empty — no rows)'
  console.log(`${t}: ${JSON.stringify(cols)}`)
}
// counts
for (const t of ['products','categories','profiles','orders','deposit_requests','inventory_items','product_variants','variants']) {
  const { count } = await sb.from(t).select('*', { head: true, count: 'exact' })
  console.log(`${t} count: ${count}`)
}
// storage buckets
const { data: buckets } = await sb.storage.listBuckets()
console.log('buckets:', JSON.stringify(buckets?.map(b => b.name)))