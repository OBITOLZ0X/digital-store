export const CURRENCIES = [
  { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', locale: 'ar-DZ' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
] as const

export const DEFAULT_CURRENCY = 'DZD'

export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' as const, locale: 'en-US' },
  { code: 'fr', name: 'Français', dir: 'ltr' as const, locale: 'fr-FR' },
] as const

export const DEFAULT_LANGUAGE = 'en'

export const ADMIN_ROLES = ['admin', 'super_admin'] as const
export const CUSTOMER_ROLES = ['customer'] as const
export const ALL_ROLES = [...ADMIN_ROLES, ...CUSTOMER_ROLES] as const

export const TRANSACTION_TYPES = [
  'deposit',
  'purchase',
  'refund',
  'admin_credit',
  'admin_debit',
  'adjustment',
] as const

export const DEPOSIT_STATUSES = ['pending', 'approved', 'rejected'] as const
export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled', 'refunded'] as const
export const SUBSCRIPTION_STATUSES = ['active', 'expiring_soon', 'expired', 'suspended', 'cancelled'] as const
export const INVENTORY_STATUSES = ['available', 'reserved', 'sold', 'expired', 'disabled'] as const
export const PRODUCT_STATUSES = ['draft', 'active', 'hidden', 'archived'] as const
export const PRODUCT_TYPES = ['digital_key', 'digital_account', 'subscription', 'iptv', 'gift_card', 'manual_delivery'] as const
export const DELIVERY_TYPES = ['automatic', 'manual'] as const
export const COUPON_TYPES = ['percentage', 'fixed'] as const

export const DEPOSIT_METHODS = [
  { code: 'ccp', name: 'CCP', description: 'Algerian Post Office Check' },
  { code: 'baridimob', name: 'BaridiMob', description: 'Mobile payment via post office' },
  { code: 'bank_transfer', name: 'Bank Transfer', description: 'Direct bank transfer' },
  { code: 'crypto', name: 'Cryptocurrency', description: 'Bitcoin, USDT, etc.' },
  { code: 'manual', name: 'Manual Payment', description: 'Pay directly when picking up' },
] as const

export const EXPIRING_SOON_DAYS = 7

export const STORAGE_PATHS = {
  products: 'products',
  avatars: 'avatars',
  screenshots: 'screenshots',
  banners: 'banners',
} as const
