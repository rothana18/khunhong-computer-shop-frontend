import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { usersApi } from '@/api/users'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import AppImage from '@/components/common/AppImage'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { imageUrl, formatDate } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import type { ManagedUser } from '@/types'

type ActionType = 'restore' | 'force'

const DeletedUsersPage: React.FC = () => {
  usePageTitle('Deleted Users')

  const [actionError, setActionError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')

  const [confirmTarget, setConfirmTarget] = useState<ManagedUser | null>(null)
  const [confirmType, setConfirmType] = useState<ActionType | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetcher = useCallback(
    (page: number) => usersApi.listTrashed({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, refresh } =
    useInfiniteList<ManagedUser>({ fetcher })

  const openConfirm = (user: ManagedUser, type: ActionType) => {
    setConfirmTarget(user)
    setConfirmType(type)
  }

  const closeConfirm = () => {
    setConfirmTarget(null)
    setConfirmType(null)
  }

  const handleAction = async () => {
    if (!confirmTarget || !confirmType) return
    setProcessing(true)
    try {
      if (confirmType === 'restore') {
        await usersApi.restore(confirmTarget.id)
      } else {
        await usersApi.forceDelete(confirmTarget.id)
      }
      closeConfirm()
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
        <h1 className="text-2xl font-bold text-gray-900">Deleted Users</h1>
        <Link to="/admin/users">
          <Button variant="outline">← Back to Users</Button>
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loading className="py-20" />
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          {query ? 'No deleted users match your search.' : 'No deleted users.'}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  <AppImage
                    src={imageUrl(user.profile_image_url)}
                    alt=""
                    className="h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <FiUser className="h-4 w-4 text-gray-400" />
                      </div>
                    }
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500">
                    {user.email}
                    {user.deleted_at && <> · Deleted: {formatDate(user.deleted_at)}</>}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="success" onClick={() => openConfirm(user, 'restore')}>
                  Restore
                </Button>
                <Button variant="danger" onClick={() => openConfirm(user, 'force')}>
                  Delete Permanently
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div ref={sentinelRef} />
      {isFetchingMore && <Loading className="py-6" />}

      <ConfirmationModal
        isOpen={confirmTarget !== null}
        title={confirmType === 'restore' ? 'Restore User' : 'Permanently Delete User'}
        message={
          confirmType === 'restore'
            ? `Restore ${confirmTarget?.full_name ?? 'this user'} and set their account back to active?`
            : `Permanently delete ${confirmTarget?.full_name ?? 'this user'}? This cannot be undone.`
        }
        confirmLabel={confirmType === 'restore' ? 'Restore' : 'Delete Permanently'}
        variant={confirmType === 'restore' ? 'success' : 'danger'}
        onConfirm={handleAction}
        onCancel={closeConfirm}
        isProcessing={processing}
      />
    </div>
  )
}

export default DeletedUsersPage
