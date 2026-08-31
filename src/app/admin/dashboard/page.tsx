import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default function AdminDashboardRedirect(){ redirect('/admin') }