import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '@/api/categories'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { apiMessage } from '@/utils/axiosError'
import { formatDate } from '@/utils/formatters'
import type { Category } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const DeletedCategoriesPage: React.FC = () => {
  usePageTitle('Deleted Categories')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [confirmType, setConfirmType] = useState<'restore' | 'force' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetcher = useCallback(
    (page: number) => categoriesApi.listTrashed({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, refresh } =
    useInfiniteList<Category>({ fetcher })

  const handleAction = async () => {
    if (!confirmId || !confirmType) return
    setProcessing(true)
    try {
      if (confirmType === 'restore') await categoriesApi.restore(confirmId)
      else await categoriesApi.forceDelete(confirmId)
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
        <h1 className="text-2xl font-bold text-gray-900">Deleted Categories</h1>
        <Link to="/admin/categories">
          <Button variant="outline">← Back to Categories</Button>
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
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No deleted categories.</p>
          ) : (
            items.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
              >
                <div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-500">
                    Deleted: {cat.deleted_at ? formatDate(cat.deleted_at) : '–'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    onClick={() => {
                      setConfirmId(cat.id)
                      setConfirmType('restore')
                    }}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirmId(cat.id)
                      setConfirmType('force')
                    }}
                  >
                    Delete Permanently
                  </Button>
                </div>
              </div>
            ))
          )}
          <div ref={sentinelRef} />
          {isFetchingMore && <Loading className="py-6" />}
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmId !== null}
        title={confirmType === 'restore' ? 'Restore Category' : 'Permanently Delete Category'}
        message={
          confirmType === 'restore'
            ? 'Restore this category?'
            : 'Permanently delete this category? This cannot be undone.'
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

export default DeletedCategoriesPage
