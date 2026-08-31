// @ts-nocheck
// Product and category admin actions
'use server'

import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId, slugify } from '@/lib/utils'
import type { ApiResult } from '@/lib/validations'

// Get all products (admin)
export async function getAllProducts(): Promise<ApiResult<Array<Record<string, unknown>>>> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (id, name, slug),
        variants:product_variants (*)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err) {
    return { success: false, error: `Failed to get products: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Get product by ID (admin)
export async function getProductById(productId: string): Promise<ApiResult<Record<string, unknown>>> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (*),
        variants:product_variants (*)
      `)
      .eq('id', productId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    return { success: false, error: `Failed to get product: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Create product (admin)
export async function createProduct(
  adminId: string,
  productData: {
    name: string
    description?: string
    short_description?: string
    category_id?: string
    price: number
    compare_at_price?: number
    currency?: string
    stock?: number
    sku?: string
    status?: string
    is_featured?: boolean
    is_popular?: boolean
    tags?: string[]
    product_type?: string
    delivery_type?: string
    subscription_duration_days?: number
    expiration_days?: number
    terms?: string
    instructions?: string
    images?: string[]
    variants?: Array<{
      name: string
      duration_days?: number
      price: number
      compare_at_price?: number
      stock?: number
      sku?: string
    }>
  }
): Promise<ApiResult<{ id: string; slug: string }>> {
  const supabase = getServerSupabase()

  try {
    const slug = slugify(productData.name) + '-' + generateId().slice(0, 8)

    // Insert product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({
        id: generateId(),
        name: productData.name,
        slug,
        description: productData.description || null,
        short_description: productData.short_description || null,
        category_id: productData.category_id || null,
        price: productData.price,
        compare_at_price: productData.compare_at_price || null,
        currency: productData.currency || 'DZD',
        stock: productData.stock ?? 0,
        sku: productData.sku || null,
        status: (productData.status as 'draft' | 'active' | 'hidden' | 'archived') || 'active',
        is_featured: productData.is_featured || false,
        is_popular: productData.is_popular || false,
        tags: productData.tags || [],
        product_type: (productData.product_type as 'digital_key' | 'digital_account' | 'subscription' | 'iptv' | 'gift_card' | 'manual_delivery') || 'digital_key',
        delivery_type: (productData.delivery_type as 'automatic' | 'manual') || 'automatic',
        subscription_duration_days: productData.subscription_duration_days || null,
        expiration_days: productData.expiration_days || null,
        terms: productData.terms || null,
        instructions: productData.instructions || null,
        images: productData.images || [],
      })
      .select()
      .single()

    if (prodError) throw prodError

    // Insert variants if provided
    if (productData.variants && productData.variants.length > 0) {
      const variantInserts = productData.variants.map((v, i) => ({
        id: generateId(),
        product_id: product.id,
        name: v.name,
        duration_days: v.duration_days || null,
        price: v.price,
        compare_at_price: v.compare_at_price || null,
        stock: v.stock ?? 0,
        sku: v.sku || null,
        sort_order: i,
      }))

      const { error: varError } = await supabase
        .from('product_variants')
        .insert(variantInserts)

      if (varError) throw varError
    }

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'product_created',
      entity_type: 'product',
      entity_id: product.id,
      details: { name: productData.name },
      ip_address: 'server',
    })

    return { success: true, data: { id: product.id, slug: product.slug } }
  } catch (err) {
    return { success: false, error: `Failed to create product: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Update product (admin)
export async function updateProduct(
  adminId: string,
  productId: string,
  productData: {
    name?: string
    description?: string
    short_description?: string
    category_id?: string
    price?: number
    compare_at_price?: number
    currency?: string
    stock?: number
    sku?: string
    status?: string
    is_featured?: boolean
    is_popular?: boolean
    tags?: string[]
    product_type?: string
    delivery_type?: string
    subscription_duration_days?: number
    expiration_days?: number
    terms?: string
    instructions?: string
    images?: string[]
  }
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const updates: Record<string, unknown> = {}

    if (productData.name !== undefined) updates.name = productData.name
    if (productData.description !== undefined) updates.description = productData.description
    if (productData.short_description !== undefined) updates.short_description = productData.short_description
    if (productData.category_id !== undefined) updates.category_id = productData.category_id || null
    if (productData.price !== undefined) updates.price = productData.price
    if (productData.compare_at_price !== undefined) updates.compare_at_price = productData.compare_at_price
    if (productData.currency !== undefined) updates.currency = productData.currency
    if (productData.stock !== undefined) updates.stock = productData.stock
    if (productData.sku !== undefined) updates.sku = productData.sku
    if (productData.status !== undefined) updates.status = productData.status
    if (productData.is_featured !== undefined) updates.is_featured = productData.is_featured
    if (productData.is_popular !== undefined) updates.is_popular = productData.is_popular
    if (productData.tags !== undefined) updates.tags = productData.tags
    if (productData.product_type !== undefined) updates.product_type = productData.product_type
    if (productData.delivery_type !== undefined) updates.delivery_type = productData.delivery_type
    if (productData.subscription_duration_days !== undefined) updates.subscription_duration_days = productData.subscription_duration_days
    if (productData.expiration_days !== undefined) updates.expiration_days = productData.expiration_days
    if (productData.terms !== undefined) updates.terms = productData.terms
    if (productData.instructions !== undefined) updates.instructions = productData.instructions
    if (productData.images !== undefined) updates.images = productData.images

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (error) throw error

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'product_updated',
      entity_type: 'product',
      entity_id: productId,
      details: { updated_fields: Object.keys(updates) },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Failed to update product: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Delete product (admin)
export async function deleteProduct(
  adminId: string,
  productId: string
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const { error } = await supabase
      .from('products')
      .update({ status: 'archived' })
      .eq('id', productId)

    if (error) throw error

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'product_archived',
      entity_type: 'product',
      entity_id: productId,
      details: {},
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Get all categories (admin)
export async function getAllCategories(): Promise<ApiResult<Array<Record<string, unknown>>>> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err) {
    return { success: false, error: `Failed to get categories: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Create category (admin)
export async function createCategory(
  adminId: string,
  data: {
    name: string
    description?: string
    parent_id?: string
    image_url?: string
  }
): Promise<ApiResult<{ id: string; slug: string }>> {
  const supabase = getServerSupabase()

  try {
    const slug = slugify(data.name)

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return { success: false, error: 'A category with this name already exists' }
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        id: generateId(),
        name: data.name,
        slug,
        description: data.description || null,
        parent_id: data.parent_id || null,
        image_url: data.image_url || null,
        sort_order: 999,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'category_created',
      entity_type: 'category',
      entity_id: category.id,
      details: { name: data.name },
      ip_address: 'server',
    })

    return { success: true, data: { id: category.id, slug: category.slug } }
  } catch (err) {
    return { success: false, error: `Failed to create category: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Update category (admin)
export async function updateCategory(
  adminId: string,
  categoryId: string,
  data: {
    name?: string
    description?: string
    parent_id?: string
    image_url?: string
    sort_order?: number
  }
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const updates: Record<string, unknown> = {}

    if (data.name !== undefined) {
      updates.name = data.name
      updates.slug = slugify(data.name)
    }
    if (data.description !== undefined) updates.description = data.description
    if (data.parent_id !== undefined) updates.parent_id = data.parent_id || null
    if (data.image_url !== undefined) updates.image_url = data.image_url
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order

    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)

    if (error) throw error

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'category_updated',
      entity_type: 'category',
      entity_id: categoryId,
      details: { updated_fields: Object.keys(updates) },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Failed to update category: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Delete category (admin)
export async function deleteCategory(
  adminId: string,
  categoryId: string
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    // Use soft delete by moving products to 'Other Digital'
    const { data: otherCat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'other-digital')
      .single()

    if (otherCat) {
      await supabase
        .from('products')
        .update({ category_id: otherCat.id })
        .eq('category_id', categoryId)
    }

    const { error } = await supabase
      .from('categories')
      .update({ name: '[Deleted]', slug: `deleted-${categoryId.slice(0, 8)}` })
      .eq('id', categoryId)

    if (error) throw error

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'category_deleted',
      entity_type: 'category',
      entity_id: categoryId,
      details: {},
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Failed to delete category: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Get public products for storefront
export async function getStoreProducts(
  options?: {
    categorySlug?: string
    search?: string
    inStock?: boolean
    minPrice?: number
    maxPrice?: number
    sort?: string
    page?: number
    limit?: number
    featured?: boolean
    popular?: boolean
  }
): Promise<ApiResult<{ products: Array<Record<string, unknown>>; total: number; categories: Array<Record<string, unknown>> }>> {
  const supabase = getServerSupabase()
  const page = options?.page || 1
  const limit = options?.limit || 24
  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories (id, name, slug, image_url),
        variants:product_variants (id, name, price, stock, duration_days)
      `, { count: 'exact' })
      .eq('status', 'active')
      .range(offset, offset + limit - 1)

    // Category filter
    if (options?.categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', options.categorySlug)
        .single()
      if (cat) {
        query = query.eq('category_id', cat.id)
      }
    }

    // Featured filter
    if (options?.featured) {
      query = query.eq('is_featured', true)
    }

    // Popular filter
    if (options?.popular) {
      query = query.eq('is_popular', true)
    }

    // In stock filter
    if (options?.inStock) {
      query = (query as Parameters<typeof query.eq>[0]).or(`stock.is.not.null,stock.gt.0`)
    }

    // Price range
    if (options?.minPrice !== undefined) {
      query = query.gte('price', options.minPrice)
    }
    if (options?.maxPrice !== undefined) {
      query = query.lte('price', options.maxPrice)
    }

    // Search
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`)
    }

    // Sort
    switch (options?.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
        query = query.order('is_popular', { ascending: false })
        break
      default:
        query = query.order('sort_order', { ascending: true })
    }

    const { data: products, error, count } = await query

    if (error) throw error

    // Get categories for sidebar
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug, image_url, sort_order')
      .order('sort_order', { ascending: true })

    return {
      success: true,
      data: {
        products: products || [],
        total: count || 0,
        categories: categories || [],
      },
    }
  } catch (err) {
    return { success: false, error: `Failed to get products: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Get product detail for public view
export async function getProductBySlug(slug: string): Promise<ApiResult<{
  product: Record<string, unknown>
  variants: Array<Record<string, unknown>>
  relatedProducts: Array<Record<string, unknown>>
}>> {
  const supabase = getServerSupabase()

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories (id, name, slug),
        variants:product_variants (id, name, price, compare_at_price, stock, duration_days, sku)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !product) {
      return { success: false, error: 'Product not found' }
    }

    // For automatic delivery, stock is from inventory_items, not variant.stock (which is 0)
    const prodAny = product as unknown as { id: string; delivery_type?: string; variants?: Array<Record<string, unknown> & { id: string; stock?: number }> }
    if (prodAny.delivery_type === 'automatic') {
      try {
        const pid = prodAny.id
        const { data: inv } = await supabase
          .from('inventory_items')
          .select('variant_id, status')
          .eq('product_id', pid)
          .limit(5000)
        const counts: Record<string, { available: number; total: number }> = {}
        for (const it of (inv as { variant_id: string | null; status: string }[] | null) || []) {
          const key = it.variant_id || '__base__'
          if (!counts[key]) counts[key] = { available: 0, total: 0 }
          counts[key].total++
          if (it.status === 'available') counts[key].available++
        }
        const vars = (prodAny.variants || []) as Array<Record<string, unknown> & { id: string; stock?: number }>
        if (vars.length > 0) {
          for (const v of vars) {
            const c = counts[v.id]
            // override stock so storefront shows real inventory
            ;(v as Record<string, unknown>).stock = c ? c.available : 0
            ;(v as Record<string, unknown>).inventory_available = c ? c.available : 0
            ;(v as Record<string, unknown>).inventory_total = c ? c.total : 0
          }
        } else {
          const c = counts['__base__']
          ;(product as unknown as Record<string, unknown>).stock = c ? c.available : 0
          ;(product as unknown as Record<string, unknown>).inventory_available = c ? c.available : 0
          ;(product as unknown as Record<string, unknown>).inventory_total = c ? c.total : 0
        }
      } catch {}
    }

    // Get related products (same category, exclude current)
    const categoryId = (product as { category_id?: string }).category_id
    let related: Array<Record<string, unknown>> = []

    if (categoryId) {
      const { data: rel, error: relError } = await supabase
        .from('products')
        .select('id, name, slug, images, price, compare_at_price, is_featured, product_type')
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .neq('id', product.id)
        .limit(4)

      if (!relError) {
        related = rel || []
      }
    }

    return {
      success: true,
      data: {
        product,
        variants: (product as { variants?: Array<Record<string, unknown>> }).variants || [],
        relatedProducts: related,
      },
    }
  } catch (err) {
    return { success: false, error: `Failed to get product: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
