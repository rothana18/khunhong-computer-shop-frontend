import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFolder, FiPackage } from 'react-icons/fi'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import Alert from '@/components/common/Alert'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, imageUrl } from '@/utils/formatters'
import { LOW_STOCK_THRESHOLD } from '@/utils/constants'
import type { Category, Product } from '@/types'
import heroImg from '@/assets/hero.png'
import { usePageTitle } from '@/hooks/usePageTitle'

const SkeletonCard: React.FC<{ aspect?: string }> = ({ aspect = 'aspect-video' }) => (
  <div className="animate-pulse overflow-hidden rounded-lg bg-white shadow">
    <div className={`${aspect} bg-gray-200`} />
    <div className="space-y-2 p-3">
      <div className="h-3 w-3/4 rounded bg-gray-200" />
    </div>
  </div>
)

const HomePage: React.FC = () => {
  usePageTitle(undefined)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingProds, setLoadingProds] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    categoriesApi
      .list({ per_page: 8 })
      .then((res) => setCategories(res.data.data))
      .catch(() => setError('Failed to load content. Please refresh the page.'))
      .finally(() => setLoadingCats(false))
    productsApi
      .list({ per_page: 8 })
      .then((res) => setProducts(res.data.data))
      .catch(() => setError('Failed to load content. Please refresh the page.'))
      .finally(() => setLoadingProds(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-xl bg-primary-800">
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative px-8 py-16 text-center sm:py-24">
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl">
            Your one-stop computer shop
          </h1>
          <p className="mt-4 text-lg text-primary-100">
            Browse our full range of computers, components, and accessories.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/products"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
            >
              Shop Now
            </Link>
            <Link
              to="/categories"
              className="rounded-md border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Categories */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
          <Link to="/categories" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {loadingCats
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} aspect="aspect-video" />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.id}`}
                  className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md"
                >
                  <div className="aspect-video bg-gray-100">
                    <AppImage
                      src={imageUrl(cat.image_url)}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <FiFolder className="h-8 w-8 text-gray-300" />
                        </div>
                      }
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Products */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
          <Link to="/products" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {loadingProds
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} aspect="aspect-square" />
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md"
                >
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
                  <div className="flex-1 p-3">
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
                    {product.stock_quantity > 0 &&
                      product.stock_quantity <= LOW_STOCK_THRESHOLD && (
                        <span className="mt-1 inline-block rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                          Low in stock
                        </span>
                      )}
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
