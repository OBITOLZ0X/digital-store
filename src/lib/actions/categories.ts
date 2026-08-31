'use server'

import { getServerSupabase } from '@/lib/supabase/server-client'
import { revalidatePath } from 'next/cache'

const adminDb = getServerSupabase()

export async function getCategories() {
  const { data, error } = await adminDb
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  
  if (error) throw error
  return data
}

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string || ''
  const imageUrl = formData.get('image_url') as string || null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isActive = formData.get('is_active') === 'on'

  if (!name || !slug) throw new Error('Name and slug required')

  const { data, error } = await adminDb
    .from('categories')
    .insert({ name, slug, description, image_url: imageUrl, sort_order: sortOrder, is_active: isActive })
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/admin/categories')
  return data
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string || ''
  const imageUrl = formData.get('image_url') as string || null
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isActive = formData.get('is_active') === 'on'

  if (!name || !slug) throw new Error('Name and slug required')

  const { data, error } = await adminDb
    .from('categories')
    .update({ name, slug, description, image_url: imageUrl, sort_order: sortOrder, is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  revalidatePath('/admin/categories')
  return data
}

export async function deleteCategory(id: string) {
  // Check if category has products
  const { data: products } = await adminDb
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1)
  
  if (products && products.length > 0) {
    throw new Error('Cannot delete: category has products. Move products first.')
  }

  const { error } = await adminDb.from('categories').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/admin/categories')
  return { success: true }
}