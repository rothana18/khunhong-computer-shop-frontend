import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsApi } from '@/api/products'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { apiMessage } from '@/utils/axiosError'
import { formatDate } from '@/utils/formatters'
import type { Product } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const DeletedProductsPage: React.FC = () => {
  usePageTitle('Deleted Products')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [confirmType, setConfirmType] = useState<'restore' | 'force' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetcher = useCallback(
    (page: number) => productsApi.listTrashed({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, refresh } =
    useInfiniteList<Product>({ fetcher })

  const handleAction = async () => {
    if (!confirmId || !confirmType) return
    setProcessing(true)
    try {
      if (confirmType === 'restore') await productsApi.restore(confirmId)
      else await productsApi.forceDelete(confirmId)
      setConfirmId(null)
      setConfirmType(null)
      refresh()
    } catch (err) {
      setActionError(apiMessage(err, 'Action failed'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deleted Products</h1>
        <Link to="/admin/products">
          <Button variant="outline">← Back to Products</Button>
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(search)
        }}
        className="mb-4 flex gap-3"
      >
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loading className="py-20" />
      ) : (
        <div>
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No deleted products.</p>
          ) : (
            <div className="space-y-2">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      SKU: {product.sku} · Deleted:{' '}
                      {product.deleted_at ? formatDate(product.deleted_at) : '–'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="success"
                      onClick={() => {
                        setConfirmId(product.id)
                        setConfirmType('restore')
                      }}
                    >
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setConfirmId(product.id)
                        setConfirmType('force')
                      }}
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={sentinelRef} />
          {isFetchingMore && <Loading className="py-6" />}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmId !== null}
        title={confirmType === 'restore' ? 'Restore Product' : 'Permanently Delete Product'}
        message={
          confirmType === 'restore'
            ? 'Restore this product so it appears in the catalogue?'
            : 'Permanently delete this product? This action cannot be undone.'
        }
        confirmLabel={confirmType === 'restore' ? 'Restore' : 'Delete Permanently'}
        variant={confirmType === 'restore' ? 'success' : 'danger'}
        onConfirm={handleAction}
        onCancel={() => {
          setConfirmId(null)
          setConfirmType(null)
        }}
        isProcessing={processing}
      />
    </div>
  )
}

export default DeletedProductsPage
