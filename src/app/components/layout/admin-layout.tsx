import Link from 'next/link'
import { LayoutDashboard, Users, Package, Tag, ShoppingCart, Warehouse, Wallet, ArrowLeftRight, Tv, Ticket, Image as ImageIcon, Settings, Shield, FileText } from 'lucide-react'

const nav = [
  { href:'/admin', label:'Dashboard', icon: LayoutDashboard },
  { href:'/admin/users', label:'Users', icon: Users },
  { href:'/admin/products', label:'Products', icon: Package },
  { href:'/admin/categories', label:'Categories', icon: Tag },
  { href:'/admin/orders', label:'Orders', icon: ShoppingCart },
  { href:'/admin/inventory', label:'Inventory', icon: Warehouse },
  { href:'/admin/deposits', label:'Deposits', icon: Wallet },
  { href:'/admin/transactions', label:'Transactions', icon: ArrowLeftRight },
  { href:'/admin/subscriptions', label:'Subscriptions', icon: Tv },
  { href:'/admin/coupons', label:'Coupons', icon: Ticket },
  { href:'/admin/logs', label:'Audit Logs', icon: FileText },
  { href:'/admin/settings', label:'Settings', icon: Settings },
]

export function AdminSidebar(){
  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-bold tracking-widest text-zinc-500">ADMIN</div>
          <div className="text-sm font-bold text-white flex items-center gap-2"><Shield className="h-4 w-4 text-violet-400"/> Control Panel</div>
        </div>
        <nav className="space-y-1">
          {nav.map(i=>(
            <Link key={i.href} href={i.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
              <i.icon className="h-4 w-4"/>{i.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
export function AdminMobileNav(){
  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {nav.map(i=>(
        <Link key={i.href} href={i.href} className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 whitespace-nowrap">{i.label}</Link>
      ))}
    </div>
  )
}
