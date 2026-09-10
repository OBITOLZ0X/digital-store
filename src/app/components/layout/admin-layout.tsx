'use client'
import Link from 'next/link'
import { LayoutDashboard, Package, Tag, Contact, Settings, Store, LogOut, Shield } from 'lucide-react'

const nav = [
  { href:'/admin', label:'Dashboard', icon: LayoutDashboard },
  { href:'/admin/products', label:'Products', icon: Package },
  { href:'/admin/categories', label:'Categories', icon: Tag },
  { href:'/admin/contacts', label:'Contact', icon: Contact },
  { href:'/admin/settings', label:'Settings', icon: Settings },
]

export function AdminSidebar(){
  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-2xl border border-white/5 bg-[#111] p-2">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-bold tracking-widest text-zinc-500">ADMIN</div>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Shield className="h-4 w-4 text-[#22d3ee]"/> Control Panel</div>
        </div>
        <nav className="space-y-1">
          {nav.map(i=>(
            <Link key={i.href} href={i.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-[#161616] hover:text-white transition">
              <i.icon className="h-4 w-4"/>{i.label}
            </Link>
          ))}
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-[#161616] hover:text-white transition">
            <Store className="h-4 w-4"/> View Store
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </aside>
  )
}

export function AdminMobileNav(){
  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {nav.map(i=>(
        <Link key={i.href} href={i.href} className="shrink-0 rounded-xl border border-white/5 bg-[#111] px-3 py-2 text-xs text-zinc-400 whitespace-nowrap">{i.label}</Link>
      ))}
    </div>
  )
}

function LogoutButton(){
  async function logout(){
    await fetch('/api/admin/auth/logout', { method:'POST' })
    window.location.href = '/admin/login'
  }
  return (
    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition">
      <LogOut className="h-4 w-4"/> Log out
    </button>
  )
}
