import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiMinus, FiPackage, FiPlus } from 'react-icons/fi'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import Alert from '@/components/common/Alert'
import AppImage from '@/components/common/AppImage'
import Loading from '@/components/common/Loading'
import { formatCurrency, imageUrl } from '@/utils/formatters'
import { LOW_STOCK_THRESHOLD } from '@/utils/constants'
import type { Category, Product } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const ProductsPage: React.FC = () => {
  usePageTitle('Products')
  const navigate = useNavigate()
  const location = useLocation()
  const { state: authState } = useAuth()
  const { addItem } = useCart()
  const [searchInput, setSearchInput] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState({ search: '', categoryId: '' as number | '' })
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set())
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const getQty = (id: number) => quantities[id] ?? 1
  const adjustQty = (e: React.MouseEvent, id: number, delta: number, max: number) => {
    e.preventDefault()
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(max, Math.max(1, (prev[id] ?? 1) + delta)),
    }))
  }

  useEffect(() => {
    categoriesApi.listAll().then(setCategories)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((q) => ({ ...q, search: searchInput }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetcher = useCallback(
    (page: number) =>
      productsApi.list({
        page,
        per_page: 20,
        search: query.search || undefined,
        category_id: query.categoryId || undefined,
      }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef } = useInfiniteList<Product>({
    fetcher,
  })

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : ''
    setCategoryId(val)
    setQuery((q) => ({ ...q, categoryId: val }))
  }

  const handleClear = () => {
    setSearchInput('')
    setCategoryId('')
    setQuery({ search: '', categoryId: '' })
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    if (!authState.isAuthenticated) {
      navigate('/auth/login', { state: { from: location } })
      return
    }
    addItem(product.id, getQty(product.id))
    setJustAdded((prev) => new Set(prev).add(product.id))
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 1500)
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <input
          id="product-search"
          type="search"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <label className="sr-only" htmlFor="product-category">
          Filter by category
        </label>
        <select
          id="product-category"
          value={categoryId}
          onChange={handleCategoryChange}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {(searchInput !== '' || categoryId !== '') && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-lg bg-white shadow">
                <div className="aspect-square bg-gray-200" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-5 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md"
              >
                <Link to={`/products/${product.id}`} className="flex-1">
                  <div className="relative aspect-square bg-gray-100">
                    <AppImage
                      src={imageUrl(product.image_url)}
                      alt={product.name}
                      className={`h-full w-full object-cover transition-opacity ${product.stock_quantity === 0 ? 'opacity-40' : 'group-hover:opacity-90'}`}
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <FiPackage className="h-10 w-10 text-gray-300" />
                        </div>
                      }
                    />
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                          Out of stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500">{product.brand.name}</p>
                    <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-primary-700">
                        {formatCurrency(product.discount_price ?? product.price)}
                      </span>
                      {product.discount_price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    {product.stock_quantity > 0 && (
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.stock_quantity <= LOW_STOCK_THRESHOLD
                            ? 'bg-accent-100 text-accent-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {product.stock_quantity <= LOW_STOCK_THRESHOLD
                          ? 'Low in stock'
                          : 'In stock'}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  {product.stock_quantity === 0 ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-md bg-gray-100 py-2 text-xs font-medium text-gray-400"
                    >
                      Out of stock
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => adjustQty(e, product.id, -1, product.stock_quantity)}
                          disabled={getQty(product.id) <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="h-3 w-3" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium">
                          {getQty(product.id)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => adjustQty(e, product.id, +1, product.stock_quantity)}
                          disabled={getQty(product.id) >= product.stock_quantity}
                          className="flex h-7 w-7 items-center justify-center rounded border hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`w-full rounded-md py-2 text-xs font-medium transition-colors ${
                          justAdded.has(product.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {justAdded.has(product.id) ? 'Added!' : 'Add to cart'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={sentinelRef} />
        {isFetchingMore && <Loading className="py-6" />}
      </div>
    </div>
  )
}

export default ProductsPage
