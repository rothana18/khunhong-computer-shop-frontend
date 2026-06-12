import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiFolder } from 'react-icons/fi'
import { categoriesApi } from '@/api/categories'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import AppImage from '@/components/common/AppImage'
import { imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { CATEGORY_STATUSES, PRODUCT_STATUS_COLORS } from '@/utils/constants'
import type { Category } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminCategoriesPage: React.FC = () => {
  usePageTitle('Categories')
  const location = useLocation()
  const [successMessage, setSuccessMessage] = useState(
    () => (location.state as { success?: string } | null)?.success ?? null
  )
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    window.history.replaceState({}, '')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetcher = useCallback(
    (page: number) => categoriesApi.list({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, refresh } =
    useInfiniteList<Category>({ fetcher })

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await categoriesApi.delete(deletingId)
      setDeletingId(null)
      refresh()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to delete category'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex gap-2">
          <Link to="/admin/categories/deleted">
            <Button variant="outline">Deleted Categories</Button>
          </Link>
          <Link to="/admin/categories/create">
            <Button>Add Category</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search categories..."
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
        <div>
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No categories found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg bg-white shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Children</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-100">
                            <AppImage
                              src={imageUrl(cat.image_url)}
                              alt=""
                              className="h-full w-full object-cover"
                              fallback={
                                <div className="flex h-full items-center justify-center">
                                  <FiFolder className="h-4 w-4 text-gray-300" />
                                </div>
                              }
                            />
                          </div>
                          <span className="font-medium text-gray-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cat.children?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRODUCT_STATUS_COLORS[cat.status]}`}
                        >
                          {CATEGORY_STATUSES[cat.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/admin/categories/${cat.id}`}>
                            <Button variant="outline">Edit</Button>
                          </Link>
                          <Button variant="danger" onClick={() => setDeletingId(cat.id)}>
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
      )}

      <ConfirmationModal
        isOpen={deletingId !== null}
        title="Delete Category"
        message="Delete this category? You can restore it later."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isProcessing={isDeleting}
      />
    </div>
  )
}

export default AdminCategoriesPage
