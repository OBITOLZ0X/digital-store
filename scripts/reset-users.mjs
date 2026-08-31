#!/usr/bin/env node
// scripts/reset-users.mjs — حذف كل المستخدمين وإنشاء جدد عبر Supabase Auth Admin API
// الاستخدام: node scripts/reset-users.mjs [--keep-admin] [--yes]
// يقرأ المتغيرات من .env.local تلقائياً

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// --- تحميل .env.local يدوياً (بدون dotenv) ---
const envPath = path.resolve('digital-store/.env.local')
if (!fs.existsSync(envPath)) {
  // جرب المسار الحالي أيضاً
  const alt = path.resolve('.env.local')
  if (fs.existsSync(alt)) {
    loadEnv(alt)
  } else {
    console.error('❌ لم أجد .env.local')
    process.exit(1)
  }
} else {
  loadEnv(envPath)
}

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY ناقص')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

// --- المستخدمون الجدد الذين سيتم إنشاؤهم ---
const NEW_USERS = [
  { email: 'admin@digitalstore.dz', password: 'Admin123!2026', full_name: 'Admin Store', role: 'admin' },
  { email: 'user1@digitalstore.dz', password: 'UserPass123!', full_name: 'User One', role: 'customer' },
  { email: 'user2@digitalstore.dz', password: 'UserPass123!', full_name: 'User Two', role: 'customer' },
  { email: 'user3@digitalstore.dz', password: 'UserPass123!', full_name: 'User Three', role: 'customer' },
]

const args = process.argv.slice(2)
const keepAdmin = args.includes('--keep-admin')
const forceYes = args.includes('--yes')

async function listAllUsers() {
  let all = []
  let page = 1
  const perPage = 100
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    all.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }
  return all
}

async function main() {
  console.log('🔍 جاري جلب كل المستخدمين...')
  const users = await listAllUsers()
  console.log(`📋 وجدت ${users.length} مستخدم(ين):`)
  for (const u of users) console.log(`  - ${u.email} (${u.id}) ${u.email_confirmed_at ? '✅' : '⏳'}`)

  if (users.length === 0) {
    console.log('لا يوجد مستخدمون للحذف.')
  } else {
    if (!forceYes) {
      console.log('\n⚠️  سيتم حذف كل هؤلاء المستخدمين نهائياً!')
      console.log('   لإلغاء اضغط Ctrl+C، للمتابعة نفّذ الأمر مع --yes')
      console.log('   مثال: node scripts/reset-users.mjs --yes')
      if (!process.env.CI) {
        // بدون --yes لا نحذف تلقائياً حمايةً من الخطأ
        console.log('\n⏸️  متوقف — أعد التشغيل مع --yes للتأكيد')
        process.exit(0)
      }
    }

    console.log('\n🗑️  حذف المستخدمين...')
    for (const u of users) {
      // تخطي admin@example.com إذا طُلب keep-admin
      if (keepAdmin && u.email === process.env.ADMIN_EMAIL) {
        console.log(`  ⏭️  تخطي ${u.email} (--keep-admin)`)
        continue
      }
      const { error } = await supabase.auth.admin.deleteUser(u.id)
      if (error) console.error(`  ❌ فشل حذف ${u.email}:`, error.message)
      else console.log(`  ✅ حُذف ${u.email}`)
    }
  }

  console.log('\n👤 إنشاء المستخدمين الجدد...')
  for (const nu of NEW_USERS) {
    console.log(`  → إنشاء ${nu.email} (${nu.role})...`)
    const { data, error } = await supabase.auth.admin.createUser({
      email: nu.email,
      password: nu.password,
      email_confirm: true,
      user_metadata: { full_name: nu.full_name },
    })
    if (error) {
      console.error(`    ❌ فشل: ${error.message}`)
      continue
    }
    const uid = data.user.id
    console.log(`    ✅ أنشئ: ${uid}`)

    // تحديث الدور في profiles (الـ trigger أنشأ صفاً افتراضياً customer)
    if (nu.role !== 'customer') {
      const { error: updErr } = await supabase.from('profiles').update({ role: nu.role }).eq('id', uid)
      if (updErr) console.error(`    ⚠️  فشل تحديث الدور: ${updErr.message}`)
      else console.log(`    🔑 الدور → ${nu.role}`)
    }

    // إعطاء رصيد تجريبي للعملاء
    if (nu.role === 'customer') {
      const { error: wErr } = await supabase.from('wallets').update({ balance: 5000 }).eq('user_id', uid)
      if (wErr) console.error(`    ⚠️  فشل تعبئة المحفظة: ${wErr.message}`)
      else console.log(`    💰 المحفظة → 5000 DZD`)
    }
  }

  console.log('\n✅ اكتملت عملية المستخدمين!')
  console.log('\n📋 بيانات الدخول:')
  for (const u of NEW_USERS) console.log(`  ${u.role.padEnd(8)} | ${u.email} | ${u.password}`)

  // تحقق نهائي
  const finalUsers = await listAllUsers()
  console.log(`\n📊 الإجمالي الآن: ${finalUsers.length} مستخدم`)
}

main().catch(e => { console.error('💥 خطأ:', e); process.exit(1) })
