#!/usr/bin/env node
// Migration: orders delivery columns, categories is_active, ensure storage bucket
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

// 1. orders: delivery_data (fulfillment content), delivered_at, fulfilled_by, admin_notes
const probes = [
  ['orders', 'delivery_data'],
  ['orders', 'delivered_at'],
  ['orders', 'fulfilled_by'],
  ['orders', 'admin_notes'],
  ['categories', 'is_active'],
]
// Supabase JS can't run raw SQL; detect missing columns by select and report needed DDL
for (const [table, col] of probes) {
  const { error } = await sb.from(table).select(col).limit(1)
  if (error && /does not exist|Could not find the column/i.test(error.message)) {
    console.log(`MISSING: ${table}.${col}`)
  } else {
    console.log(`OK: ${table}.${col}`)
  }
}

// 2. Ensure storage bucket 'images'
const { data: buckets } = await sb.storage.listBuckets()
if (!buckets?.find(b => b.name === 'images')) {
  const { error } = await sb.storage.createBucket('images', { public: true })
  console.log('bucket images:', error ? `ERR ${error.message}` : 'created')
} else {
  console.log('bucket images: exists')
}
console.log('NOTE: missing columns must be added via SQL editor or rpc below')