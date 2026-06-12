import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FiMinus, FiPackage, FiPlus } from 'react-icons/fi'
import { productsApi } from '@/api/products'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { LOW_STOCK_THRESHOLD } from '@/utils/constants'
import type { Product } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { usePageTitle } from '@/hooks/usePageTitle'
import DOMPurify from 'dompurify'

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useAuth()
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    productsApi
      .getById(Number(id))
      .then((res) => setProduct(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load product')))
      .finally(() => setLoading(false))
  }, [id])

  usePageTitle(product?.name)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!product) return null

  const imgUrl = imageUrl(product.image_url)
  const price = product.discount_price ?? product.price

  return (
    <div>
      <div className="mb-4">
        <Link to="/products" className="text-sm text-primary-600 hover:underline">
          ← Back to products
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="aspect-square w-full shrink-0 overflow-hidden rounded-md bg-gray-100 sm:w-64">
                <AppImage
                  src={imgUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <FiPackage className="h-16 w-16 text-gray-300" />
                    </div>
                  }
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  {product.brand.name} · SKU: {product.sku}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="mt-1 text-sm text-gray-500">{product.category.name}</p>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-primary-700">
                    {formatCurrency(price)}
                  </span>
                  {product.discount_price && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  {product.stock_quantity === 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Out of stock
                    </span>
                  ) : product.stock_quantity <= LOW_STOCK_THRESHOLD ? (
                    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                      Low in stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      In stock
                    </span>
                  )}
                </div>

                {product.short_description && (
                  <p className="mt-4 text-sm text-gray-600">{product.short_description}</p>
                )}

                {product.stock_quantity > 0 && (
                  <div className="mt-6 space-y-3">
                    {state.isAuthenticated ? (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            disabled={qty <= 1}
                            className="flex h-9 w-9 items-center justify-center rounded border hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <FiMinus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span
                            className="w-10 text-center text-sm font-medium"
                            aria-label={`Quantity: ${qty}`}
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty((q) => Math.min(product.stock_quantity, q + 1))}
                            disabled={qty >= product.stock_quantity}
                            className="flex h-9 w-9 items-center justify-center rounded border hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <FiPlus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="text-xs text-gray-500">
                            {product.stock_quantity} available
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => {
                              addItem(product.id, qty)
                              setAdded(true)
                              setTimeout(() => setAdded(false), 1500)
                            }}
                          >
                            {added ? 'Added to cart!' : 'Add to cart'}
                          </Button>
                          {added && (
                            <button
                              onClick={() => navigate('/cart')}
                              className="text-sm text-primary-600 hover:underline"
                            >
                              View cart
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <Link to="/auth/login" state={{ from: location }}>
                        <Button>Login to order</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {product.description && (
            <Card title="Description">
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Details">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900">{product.category.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Brand</dt>
                <dd className="font-medium text-gray-900">{product.brand.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">SKU</dt>
                <dd className="font-medium text-gray-900">{product.sku}</dd>
              </div>
              {product.is_featured && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Featured</dt>
                  <dd className="font-medium text-accent-600">Yes</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage
