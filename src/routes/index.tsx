import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import MainLayout from '@/layouts/MainLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import NotFoundPage from '@/pages/NotFoundPage'
import RootRedirect from '@/routes/RootRedirect'
import {
  ProductsPage,
  ProductDetailPage,
  CategoriesPage,
  CategoryDetailPage,
  OrdersPage,
  NewOrderPage,
  OrderDetailPage,
  AddressesPage,
  CustomerInvoicesPage,
  CustomerInvoiceDetailPage,
  CustomerShipmentsPage,
  CustomerShipmentDetailPage,
  ProfilePage,
  AdminDashboardPage,
  AdminProductsPage,
  AdminProductFormPage,
  AdminDeletedProductsPage,
  AdminCategoriesPage,
  AdminCategoryFormPage,
  AdminDeletedCategoriesPage,
  AdminUsersPage,
  AdminUserFormPage,
  AdminDeletedUsersPage,
  AdminUserDetailPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminPaymentDetailPage,
  AdminShipmentsPage,
  AdminShipmentDetailPage,
  AdminInvoicesPage,
  AdminInvoiceDetailPage,
} from '@/routes/pages'

export const router = createBrowserRouter(
  [
    {
      path: '/auth',
      element: <AuthLayout />,
      children: [
        { path: 'login', element: <LoginPage /> },
        { path: 'register', element: <RegisterPage /> },
      ],
    },
    {
      path: '/',
      element: <MainLayout />,
      children: [
        { index: true, element: <RootRedirect /> },

        // Public
        { path: 'products', element: <ProductsPage /> },
        { path: 'products/:id', element: <ProductDetailPage /> },
        { path: 'categories', element: <CategoriesPage /> },
        { path: 'categories/:id', element: <CategoryDetailPage /> },

        // Customer (authenticated)
        {
          element: <ProtectedRoute />,
          children: [
            { path: 'profile', element: <ProfilePage /> },
            { path: 'orders', element: <OrdersPage /> },
            { path: 'cart', element: <NewOrderPage /> },
            { path: 'orders/:id', element: <OrderDetailPage /> },
            { path: 'addresses', element: <AddressesPage /> },
            { path: 'invoices', element: <CustomerInvoicesPage /> },
            { path: 'invoices/:id', element: <CustomerInvoiceDetailPage /> },
            { path: 'shipments', element: <CustomerShipmentsPage /> },
            { path: 'shipments/:id', element: <CustomerShipmentDetailPage /> },
          ],
        },

        // Admin / staff
        {
          path: 'admin',
          element: <ProtectedRoute roles={['admin', 'staff']} />,
          children: [
            { index: true, element: <AdminDashboardPage /> },
            {
              element: <ProtectedRoute roles={['admin']} />,
              children: [
                { path: 'products', element: <AdminProductsPage /> },
                { path: 'products/deleted', element: <AdminDeletedProductsPage /> },
                { path: 'products/create', element: <AdminProductFormPage /> },
                { path: 'products/:id', element: <AdminProductFormPage /> },
                { path: 'categories', element: <AdminCategoriesPage /> },
                { path: 'categories/deleted', element: <AdminDeletedCategoriesPage /> },
                { path: 'categories/create', element: <AdminCategoryFormPage /> },
                { path: 'categories/:id', element: <AdminCategoryFormPage /> },
                { path: 'users', element: <AdminUsersPage /> },
                { path: 'users/deleted', element: <AdminDeletedUsersPage /> },
                { path: 'users/create', element: <AdminUserFormPage /> },
                { path: 'users/:id', element: <AdminUserDetailPage /> },
              ],
            },
            { path: 'orders', element: <AdminOrdersPage /> },
            { path: 'orders/:id', element: <AdminOrderDetailPage /> },
            { path: 'payments/:id', element: <AdminPaymentDetailPage /> },
            { path: 'shipments', element: <AdminShipmentsPage /> },
            { path: 'shipments/:id', element: <AdminShipmentDetailPage /> },
            { path: 'invoices', element: <AdminInvoicesPage /> },
            { path: 'invoices/:id', element: <AdminInvoiceDetailPage /> },
          ],
        },

        { path: 'unauthorized', element: <UnauthorizedPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
)
