import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'
import { productsApi } from '@/api/products'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { PRODUCT_STATUS_COLORS, PRODUCT_STATUSES } from '@/utils/constants'
import type { Product } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminProductsPage: React.FC = () => {
  usePageTitle('Products')
  const location = useLocation()
  const [successMessage, setSuccessMessage] = useState(
    () => (location.state as { success?: string } | null)?.success ?? null
  )
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    window.history.replaceState({}, '')
  }, [])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetcher = useCallback(
    (page: number) => productsApi.list({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, total, refresh } =
    useInfiniteList<Product>({ fetcher })

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await productsApi.delete(deletingId)
      setDeletingId(null)
      refresh()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to delete product'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          <Link to="/admin/products/deleted">
            <Button variant="outline">Deleted Products</Button>
          </Link>
          <Link to="/admin/products/create">
            <Button>Add Product</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name, SKU, brand..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loading className="py-20" />
      ) : (
        <>
          {total > 0 && <p className="mb-3 text-sm text-gray-500">{total} products</p>}
          <div>
            {items.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No products found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                              <AppImage
                                src={imageUrl(product.image_url)}
                                alt=""
                                className="h-full w-full object-cover"
                                fallback={
                                  <div className="flex h-full items-center justify-center">
                                    <FiPackage className="h-5 w-5 text-gray-300" />
                                  </div>
                                }
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.brand.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{product.sku}</td>
                        <td className="px-4 py-3 text-gray-600">{product.category.name}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(product.discount_price ?? product.price)}
                        </td>
                        <td className="px-4 py-3 text-right">{product.stock_quantity}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRODUCT_STATUS_COLORS[product.status]}`}
                          >
                            {PRODUCT_STATUSES[product.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link to={`/admin/products/${product.id}`}>
                              <Button variant="outline">Edit</Button>
                            </Link>
                            <Button variant="danger" onClick={() => setDeletingId(product.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div ref={sentinelRef} />
            {isFetchingMore && <Loading className="py-6" />}
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={deletingId !== null}
        title="Delete Product"
        message="Delete this product? You can restore it later."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isProcessing={isDeleting}
      />
    </div>
  )
}

export default AdminProductsPage
