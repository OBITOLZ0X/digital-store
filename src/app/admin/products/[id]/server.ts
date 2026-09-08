// Server helper for the admin edit page (kept separate so the page file stays clean).
import 'server-only'
import { readStore } from '@/lib/store'

export async function getAdminProduct(id: string) {
  const store = await readStore()
  return store.products.find(p => p.id === id) || null
}
