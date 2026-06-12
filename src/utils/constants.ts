import type {
  Category,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Shipment,
  ShippingMethod,
  UserRoleSlug,
} from '@/types'

export const LOW_STOCK_THRESHOLD = Number(import.meta.env.VITE_LOW_STOCK_THRESHOLD ?? 5)

export const PRODUCT_STATUSES: Record<Product['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export const PRODUCT_STATUS_COLORS: Record<Product['status'], string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
}

export const CATEGORY_STATUSES: Record<Category['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
}

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  khqr: 'KHQR',
  cash_on_delivery: 'Cash on Delivery',
}

export const SHIPPING_METHODS: Record<ShippingMethod, string> = {
  express_delivery: 'Express Delivery',
  standard_delivery: 'Standard Delivery',
}

export const ORDER_STATUSES: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUSES: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  voided: 'Voided',
  refunded: 'Refunded',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-gray-100 text-gray-800',
  paid: 'bg-green-100 text-green-800',
  voided: 'bg-orange-100 text-orange-800',
  refunded: 'bg-red-100 text-red-800',
}

export const USER_ROLES: Record<UserRoleSlug, string> = {
  admin: 'Administrator',
  staff: 'Staff',
  customer: 'Customer',
}

export const USER_ROLE_IDS: Record<UserRoleSlug, number> = {
  // TODO: Not good hard-coded, slug should be used for API calls instead
  admin: 1,
  staff: 2,
  customer: 3,
}

export const SHIPMENT_STATUSES: Record<Shipment['status'], string> = {
  in_transit: 'In Transit',
  delivered: 'Delivered',
}

export const SHIPMENT_STATUS_COLORS: Record<Shipment['status'], string> = {
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
}
