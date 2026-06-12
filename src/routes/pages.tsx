import React, { Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import ErrorBoundary from '@/routes/ErrorBoundary'
import Loading from '@/components/common/Loading'

/**
 * Wraps a lazy-loaded page with ErrorBoundary + Suspense.
 *
 * React.lazy() is called ONCE at module initialisation (when withSuspense runs),
 * so Comp has a stable identity across renders. The previous pattern called
 * React.lazy() inside the component body, creating a new type on every render
 * and causing Suspense to flash on every context update.
 *
 * key={pathname} on ErrorBoundary ensures hasError resets when the user
 * navigates to a different route after a crash (fix #5).
 */
function withSuspense(factory: () => Promise<{ default: React.ComponentType }>) {
  const Comp = React.lazy(factory)
  return function LazyPage() {
    const { pathname } = useLocation()
    return (
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<Loading fullPage />}>
          <Comp />
        </Suspense>
      </ErrorBoundary>
    )
  }
}

// Customer pages
export const ProductsPage = withSuspense(() => import('@/pages/customer/products/ProductsPage'))
export const ProductDetailPage = withSuspense(
  () => import('@/pages/customer/products/ProductDetailPage')
)
export const CategoriesPage = withSuspense(
  () => import('@/pages/customer/categories/CategoriesPage')
)
export const CategoryDetailPage = withSuspense(
  () => import('@/pages/customer/categories/CategoryDetailPage')
)
export const OrdersPage = withSuspense(() => import('@/pages/customer/orders/OrdersPage'))
export const NewOrderPage = withSuspense(() => import('@/pages/customer/orders/NewOrderPage'))
export const OrderDetailPage = withSuspense(() => import('@/pages/customer/orders/OrderDetailPage'))
export const AddressesPage = withSuspense(() => import('@/pages/customer/addresses/AddressesPage'))
export const CustomerInvoicesPage = withSuspense(
  () => import('@/pages/customer/invoices/InvoicesPage')
)
export const CustomerInvoiceDetailPage = withSuspense(
  () => import('@/pages/customer/invoices/InvoiceDetailPage')
)
export const CustomerShipmentsPage = withSuspense(
  () => import('@/pages/customer/shipments/ShipmentsPage')
)
export const CustomerShipmentDetailPage = withSuspense(
  () => import('@/pages/customer/shipments/ShipmentDetailPage')
)

// Shared authenticated pages
export const ProfilePage = withSuspense(() => import('@/pages/profile/ProfilePage'))

// Admin pages
export const AdminDashboardPage = withSuspense(() => import('@/pages/admin/DashboardPage'))
export const AdminProductsPage = withSuspense(() => import('@/pages/admin/products/ProductsPage'))
export const AdminProductFormPage = withSuspense(
  () => import('@/pages/admin/products/ProductFormPage')
)
export const AdminDeletedProductsPage = withSuspense(
  () => import('@/pages/admin/products/DeletedProductsPage')
)
export const AdminCategoriesPage = withSuspense(
  () => import('@/pages/admin/categories/CategoriesPage')
)
export const AdminCategoryFormPage = withSuspense(
  () => import('@/pages/admin/categories/CategoryFormPage')
)
export const AdminDeletedCategoriesPage = withSuspense(
  () => import('@/pages/admin/categories/DeletedCategoriesPage')
)
export const AdminUsersPage = withSuspense(() => import('@/pages/admin/users/UsersPage'))
export const AdminUserFormPage = withSuspense(() => import('@/pages/admin/users/UserFormPage'))
export const AdminDeletedUsersPage = withSuspense(
  () => import('@/pages/admin/users/DeletedUsersPage')
)
export const AdminUserDetailPage = withSuspense(() => import('@/pages/admin/users/UserDetailPage'))
export const AdminOrdersPage = withSuspense(() => import('@/pages/admin/orders/OrdersPage'))
export const AdminOrderDetailPage = withSuspense(
  () => import('@/pages/admin/orders/OrderDetailPage')
)
export const AdminPaymentDetailPage = withSuspense(
  () => import('@/pages/admin/payments/PaymentDetailPage')
)
export const AdminShipmentsPage = withSuspense(
  () => import('@/pages/admin/shipments/ShipmentsPage')
)
export const AdminShipmentDetailPage = withSuspense(
  () => import('@/pages/admin/shipments/ShipmentDetailPage')
)
export const AdminInvoicesPage = withSuspense(() => import('@/pages/admin/invoices/InvoicesPage'))
export const AdminInvoiceDetailPage = withSuspense(
  () => import('@/pages/admin/invoices/InvoiceDetailPage')
)
