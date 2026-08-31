import Link from 'next/link'
import { LayoutDashboard, Package, Wallet, ArrowLeftRight, Tv, Heart, User, Settings, LogOut } from 'lucide-react'

const nav = [
  { href:'/account', label:'Dashboard', icon: LayoutDashboard },
  { href:'/account/orders', label:'Orders', icon: Package },
  { href:'/account/subscriptions', label:'Subscriptions', icon: Tv },
  { href:'/account/wallet', label:'Wallet', icon: Wallet },
  { href:'/account/transactions', label:'Transactions', icon: ArrowLeftRight },
  { href:'/account/favorites', label:'Favorites', icon: Heart },
  { href:'/account/profile', label:'Profile', icon: User },
  { href:'/account/settings', label:'Settings', icon: Settings },
]

export function AccountLayout({ children }: { children: React.ReactNode }){
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64 shrink-0">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 sticky top-20">
          <nav className="space-y-1">
            {nav.map(item=>(
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition">
                <item.icon className="h-4 w-4"/>{item.label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="post" className="pt-2 border-t border-zinc-800 mt-2">
              <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10">
                <LogOut className="h-4 w-4"/> Logout
              </button>
            </form>
          </nav>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
