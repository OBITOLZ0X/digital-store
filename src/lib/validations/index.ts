import { z } from 'zod'

// ─── Auth ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required').max(100).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

// ─── Product ─────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(5000).optional(),
  short_description: z.string().max(500).optional(),
  category_id: z.string().uuid().optional(),
  images: z.array(z.string().url().or(z.string().startsWith('http'))).max(10).optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  compare_at_price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional(),
  status: z.enum(['draft', 'active', 'hidden', 'archived']).optional(),
  is_featured: z.boolean().optional(),
  is_popular: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  product_type: z.enum(['digital_key', 'digital_account', 'subscription', 'iptv', 'gift_card', 'manual_delivery']).optional(),
  delivery_type: z.enum(['automatic', 'manual']).optional(),
  subscription_duration_days: z.number().int().min(1).optional(),
  expiration_days: z.number().int().min(1).optional(),
  terms: z.string().max(5000).optional(),
  instructions: z.string().max(5000).optional(),
  sort_order: z.number().int().optional(),
})

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').max(200),
  duration_days: z.number().int().min(1).optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  compare_at_price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional(),
  sort_order: z.number().int().optional(),
})

export const productCreateUpdateSchema = productSchema.extend({
  variants: z.array(productVariantSchema).optional(),
})

// ─── Category ────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(1000).optional(),
  parent_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  sort_order: z.number().int().optional(),
})

// ─── Inventory ───────────────────────────────────────────────────────

export const inventoryItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  product_data: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'expired', 'disabled']).optional(),
})

export const inventoryBulkImportSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  items: z.array(z.string()).min(1, 'At least one item is required').max(1000),
})

// ─── Order ───────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(100),
  coupon_code: z.string().optional(),
})

// ─── Wallet ──────────────────────────────────────────────────────────

export const depositRequestSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least 1'),
  currency: z.string().length(3).optional(),
  payment_method: z.string().min(1, 'Payment method is required'),
  reference_number: z.string().max(200).optional(),
  screenshot_url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
})

export const adminCreditSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().min(0.01, 'Amount must be at least 0.01'),
  reason: z.string().min(1, 'Reason is required').max(500),
})

export const adminDebitSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().min(0.01, 'Amount must be at least 0.01'),
  reason: z.string().min(1, 'Reason is required').max(500),
})

export const refundSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required').max(500),
})

// ─── Subscription ────────────────────────────────────────────────────

export const renewSubscriptionSchema = z.object({
  subscription_id: z.string().uuid(),
  variant_id: z.string().uuid(),
})

// ─── Coupon ──────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50).regex(/^[A-Z0-9]+$/i, 'Code must be alphanumeric'),
  type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0).max(100),
  min_order_amount: z.number().min(0).optional(),
  max_discount: z.number().min(0).optional(),
  usage_limit: z.number().int().min(1).optional(),
  per_user_limit: z.number().int().min(1).optional(),
  start_date: z.string().datetime().optional(),
  expiration_date: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
})

// ─── Admin ───────────────────────────────────────────────────────────

export const adminLogSchema = z.object({
  action: z.string().min(1).max(100),
  entity_type: z.string().min(1).max(50),
  entity_id: z.string().uuid().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
})

// ─── Settings ────────────────────────────────────────────────────────

export const storeSettingsSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(5000).optional(),
})

// ─── Search ──────────────────────────────────────────────────────────

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200).optional(),
  category: z.string().uuid().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  in_stock: z.boolean().optional(),
  sort: z.enum(['featured', 'price_asc', 'price_desc', 'newest', 'popular']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

// ─── API Request/Response Types ──────────────────────────────────────

export const apiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
})

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string }
