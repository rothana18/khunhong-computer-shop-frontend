export interface User {
  id: number
  first_name: string
  last_name: string
  full_name?: string
  email: string
  phone?: string
  email_verified?: boolean
  status?: string
  profile_image?: string | null
  role: 'customer' | 'staff' | 'admin'
  permissions: string[]
  member_since?: string
  created_at?: string
}

export type UserStatus = 'active' | 'inactive' | 'banned'
export type UserRoleSlug = 'customer' | 'staff' | 'admin'

/** Shape returned by the admin user-management endpoints (GET /users, GET /users/:id, etc.) */
export interface ManagedUser {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  email_verified: boolean
  status: UserStatus
  profile_image_url: string | null
  role: string
  addresses: Address[]
  permissions: string[]
  member_since: string
  created_at: string
  deleted_at?: string | null
}

export interface Category {
  id: number
  parent_id?: number
  name: string
  description?: string
  image_url?: string
  status: 'active' | 'inactive'
  children?: Category[]
  products?: Product[]
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Brand {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  name: string
  brand: Brand
  slug: string
  sku: string
  price: string
  discount_price?: string
  has_discount: boolean
  stock_quantity: number
  in_stock: boolean
  low_stock: boolean
  short_description?: string
  description?: string
  image_url?: string
  is_featured: boolean
  status: 'active' | 'inactive'
  category: Category
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Address {
  id: number
  user_id: number
  full_name: string
  phone: string
  province: string
  district_khan: string
  commune_sangkat: string
  street_house: string
  is_default: boolean
  created_at: string
  updated_at: string
}

/** Slim cart entry — only the ID is persisted; fresh product data is fetched at checkout. */
export interface CartItem {
  productId: number
  quantity: number
}

export interface OrderItem {
  id: number
  product_id: number
  name: string
  sku: string
  quantity: number
  unit_price: number
  subtotal: number
  product_image_url: string | null
  created_at: string
}

export type PaymentMethod = 'bank_transfer' | 'khqr' | 'cash_on_delivery'
export type ShippingMethod = 'express_delivery' | 'standard_delivery'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'voided' | 'refunded'

export interface Payment {
  id: number
  order_id: number
  order?: Order
  method: PaymentMethod
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  transaction_id: string | null
  payment_proof_url: string | null
  payment_date: string | null
  is_refunded: boolean
  refunded_at: string | null
  refund_reason: string | null
  created_at: string
  updated_at: string
}

export interface Shipment {
  id: number
  order_id: number
  order?: Order
  tracking_number: string
  carrier: string
  ship_date: string
  status: 'in_transit' | 'delivered'
  proof_of_delivery?: string
  delivery_notes?: string
  delivered_at?: string
  created_at: string
  updated_at: string
}

export interface InvoiceCustomer {
  name: string
  email: string | null
  phone: string | null
  shipping_name: string
  shipping_phone: string
  address: string
}

export interface InvoiceFinancial {
  subtotal: number
  shipping_cost: number
  discount_amount: number
  grand_total: number
  currency: string
}

export interface InvoicePayment {
  method: PaymentMethod
  status: string
  transaction_id: string
  amount: number
  date: string
}

export interface InvoiceOrderSummary {
  id: number
  invoice_no: string
  status: OrderStatus
  payment_status: PaymentStatus
}

export interface Invoice {
  id: number
  invoice_no: string
  order_id: number
  customer: InvoiceCustomer
  financial: InvoiceFinancial
  payment: InvoicePayment
  items: OrderItem[]
  order: InvoiceOrderSummary
  issue_date: string
  created_at: string
  /** Present on voided invoices */
  is_voided?: boolean
  void_reason?: string
}

export interface Order {
  id: number
  invoice_no: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total_amount: number
  currency: string
  items: OrderItem[]
  payment_method: PaymentMethod
  shipping_method: ShippingMethod
  status: OrderStatus
  payment_status: PaymentStatus
  order_notes: string | null
  payments?: Payment[]
  shipment?: Shipment | null
  invoice?: Invoice
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

export interface ApiResponse<T> {
  status: string
  message: string
  data: T
}

export interface PaginatedApiResponse<T> {
  status: string
  message: string
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface ShipmentSummary {
  in_transit: number
  delivered_today: number
  cancelled_total: number
  ready_to_ship: number
}

export interface InvoiceAnalyticsByMethod {
  count: number
  total: number
}

export interface InvoiceAnalytics {
  summary: {
    total_invoices: number
    total_revenue: number
    total_discounts: number
    total_refunds: number
  }
  by_payment_method: {
    bank_transfer: InvoiceAnalyticsByMethod
    khqr: InvoiceAnalyticsByMethod
    cash_on_delivery: InvoiceAnalyticsByMethod
  }
  date_range: {
    from: string
    to: string
  }
}
