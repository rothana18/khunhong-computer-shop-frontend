import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FiChevronDown, FiMenu, FiShoppingCart, FiX } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import Button from '@/components/common/Button'

const Navbar: React.FC = () => {
  const { state, logout } = useAuth()
  const { user } = state
  const { itemCount } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'
  const isAdminOrStaff = isAdmin || isStaff

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-700 text-white'
        : 'text-primary-100 hover:bg-primary-700 hover:text-white'
    }`

  const dropdownLinkClass = 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'

  const handleLogout = () => {
    void logout()
  }

  // Desktop primary nav links (visible without scrolling)
  const customerPrimaryLinks = (
    <>
      <NavLink to="/products" className={navLinkClass}>
        Products
      </NavLink>
      <NavLink to="/categories" className={navLinkClass}>
        Categories
      </NavLink>
      {state.isAuthenticated && (
        <NavLink to="/orders" className={navLinkClass}>
          My Orders
        </NavLink>
      )}
    </>
  )

  const adminPrimaryLinks = (
    <>
      <NavLink to="/admin" end className={navLinkClass}>
        Dashboard
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin/products" className={navLinkClass}>
          Products
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin/categories" className={navLinkClass}>
          Categories
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin/users" className={navLinkClass}>
          Users
        </NavLink>
      )}
      <NavLink to="/admin/orders" className={navLinkClass}>
        Orders
      </NavLink>
      <NavLink to="/admin/shipments" className={navLinkClass}>
        Shipments
      </NavLink>
      <NavLink to="/admin/invoices" className={navLinkClass}>
        Invoices
      </NavLink>
    </>
  )

  // Mobile flat link list (unchanged UX — no dropdowns on small screens)
  const customerMobileLinks = (
    <>
      <NavLink to="/products" className={navLinkClass}>
        Products
      </NavLink>
      <NavLink to="/categories" className={navLinkClass}>
        Categories
      </NavLink>
      {state.isAuthenticated && (
        <>
          <NavLink to="/orders" className={navLinkClass}>
            My Orders
          </NavLink>
          <NavLink to="/addresses" className={navLinkClass}>
            Addresses
          </NavLink>
          <NavLink to="/invoices" className={navLinkClass}>
            Invoices
          </NavLink>
          <NavLink to="/shipments" className={navLinkClass}>
            Shipments
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            My Profile
          </NavLink>
        </>
      )}
    </>
  )

  const adminMobileLinks = (
    <>
      <NavLink to="/admin" end className={navLinkClass}>
        Dashboard
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin/products" className={navLinkClass}>
          Products
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin/categories" className={navLinkClass}>
          Categories
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin/users" className={navLinkClass}>
          Users
        </NavLink>
      )}
      <NavLink to="/admin/orders" className={navLinkClass}>
        Orders
      </NavLink>
      <NavLink to="/admin/shipments" className={navLinkClass}>
        Shipments
      </NavLink>
      <NavLink to="/admin/invoices" className={navLinkClass}>
        Invoices
      </NavLink>
      <NavLink to="/profile" className={navLinkClass}>
        My Profile
      </NavLink>
    </>
  )

  return (
    <nav className="sticky top-0 z-40 w-full bg-primary-700 shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Khunhong Computer Shop</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {isAdminOrStaff ? adminPrimaryLinks : customerPrimaryLinks}
          </div>

          {/* Desktop right section */}
          <div className="hidden items-center gap-3 md:flex">
            {state.isAuthenticated && !isAdminOrStaff && (
              <Link
                to="/cart"
                className="relative text-primary-100 hover:text-white"
                aria-label="Cart"
              >
                <FiShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}
            {state.isAuthenticated ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-1 text-sm text-primary-100 transition-colors hover:text-white"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  {user?.first_name}
                  <FiChevronDown
                    className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10">
                    {!isAdminOrStaff && (
                      <>
                        <NavLink to="/addresses" className={dropdownLinkClass}>
                          Addresses
                        </NavLink>
                        <NavLink to="/invoices" className={dropdownLinkClass}>
                          Invoices
                        </NavLink>
                        <NavLink to="/shipments" className={dropdownLinkClass}>
                          Shipments
                        </NavLink>
                      </>
                    )}
                    <NavLink to="/profile" className={dropdownLinkClass}>
                      My Profile
                    </NavLink>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="text-sm text-primary-100 hover:text-white">
                  Login
                </Link>
                <Link to="/auth/register">
                  <Button variant="accent">Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile cart icon + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            {state.isAuthenticated && !isAdminOrStaff && (
              <Link
                to="/cart"
                className="relative rounded p-2 text-primary-100 hover:bg-primary-600"
                aria-label="Cart"
              >
                <FiShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}
            <button
              className="rounded p-2 text-primary-100 hover:bg-primary-600"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="space-y-1 border-t border-primary-600 px-4 py-3 md:hidden">
          {isAdminOrStaff ? adminMobileLinks : customerMobileLinks}
          <div className="mt-2 border-t border-primary-600 pt-2">
            {state.isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full rounded px-3 py-2 text-left text-sm text-primary-100 hover:bg-primary-600"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="block rounded px-3 py-2 text-sm text-primary-100 hover:bg-primary-600"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="block rounded px-3 py-2 text-sm text-primary-100 hover:bg-primary-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
