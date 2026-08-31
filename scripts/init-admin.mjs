#!/usr/bin/env node
// Admin initialization script — run once after Supabase setup
// Usage: node scripts/init-admin.mjs
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD in env

import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually (Node doesn't auto-load it like Next.js does)
try {
  const envPath = new URL('../.env.local', import.meta.url)
  const envText = fs.readFileSync(envPath, 'utf8')
  for(const line of envText.split('\n')){
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/)
    if(m){ const k=m[1].trim(); let v=m[2].trim(); if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1); if(!process.env[k]) process.env[k]=v }
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!url || !serviceKey || !email || !password) {
  console.error('Missing required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false } })

async function main(){
  console.log(`Creating admin: ${email}`)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin' }
  })
  if (error) {
    // If user exists, try to update
    console.error('Create error:', error.message)
    // Try list and update role
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find(u => u.email === email)
    if (existing) {
      console.log('User exists, promoting to admin...')
      await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', existing.id)
      console.log('Promoted to super_admin')
      return
    }
    process.exit(1)
  }
  console.log('User created:', data.user.id)
  const { error: updError } = await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', data.user.id)
  if (updError) console.error('Role update error:', updError.message)
  else console.log('Promoted to super_admin ✓')
  console.log('Done. Remove ADMIN_PASSWORD from env after first run!')
}

main()
