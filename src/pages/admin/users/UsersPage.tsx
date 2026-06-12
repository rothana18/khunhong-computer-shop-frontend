import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { usersApi } from '@/api/users'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import AppImage from '@/components/common/AppImage'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { imageUrl, formatUserRoleBadge, formatUserStatusBadge } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import type { ManagedUser } from '@/types'

const UsersPage: React.FC = () => {
  usePageTitle('Users')
  const { state: authState } = useAuth()
  const location = useLocation()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    () => (location.state as { success?: string } | null)?.success ?? null
  )

  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Confirmation modals
  const [toggleTarget, setToggleTarget] = useState<ManagedUser | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<ManagedUser | null>(null)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

  const [actionProcessing, setActionProcessing] = useState(false)

  useEffect(() => {
    window.history.replaceState({}, '')
  }, [])

  const loadUsers = useCallback(() => {
    setLoading(true)
    usersApi
      .list()
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load users')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').toLowerCase().includes(q)
    )
  }, [users, search])

  // Bulk select helpers
  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id))
  const someSelected = filtered.some((u) => selectedIds.has(u.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.id)))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Actions
  const handleToggleStatus = async () => {
    if (!toggleTarget) return
    setActionProcessing(true)
    try {
      await usersApi.toggleStatus(toggleTarget.id)
      setToggleTarget(null)
      loadUsers()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to toggle user status'))
    } finally {
      setActionProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!deactivateTarget) return
    setActionProcessing(true)
    try {
      await usersApi.delete(deactivateTarget.id)
      setDeactivateTarget(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deactivateTarget.id)
        return next
      })
      loadUsers()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to delete user'))
    } finally {
      setActionProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    setActionProcessing(true)
    try {
      await usersApi.bulkDelete(Array.from(selectedIds))
      setBulkConfirmOpen(false)
      setSelectedIds(new Set())
      loadUsers()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to delete selected users'))
    } finally {
      setActionProcessing(false)
    }
  }

  const isSelf = (id: number) => authState.user?.id === id

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2">
          <Link to="/admin/users/deleted">
            <Button variant="outline">Deleted Users</Button>
          </Link>
          <Link to="/admin/users/create">
            <Button>Add User</Button>
          </Link>
        </div>
      </div>

      {/* Search + bulk actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-48 flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        {someSelected && (
          <Button variant="danger" onClick={() => setBulkConfirmOpen(true)}>
            Delete Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {error && <Alert type="error" message={error} />}

      {loading ? (
        <Loading className="py-20" />
      ) : (
        <>
          {users.length > 0 && (
            <p className="mb-3 text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
              {search && users.length !== filtered.length && ` of ${users.length}`}
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              {search ? 'No users match your search.' : 'No active users found.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg bg-white shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Member Since</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((user) => {
                    const { label: roleLabel, className: roleColor } = formatUserRoleBadge(user.role)
                    const { label: statusLabel, className: statusColor } = formatUserStatusBadge(user.status)
                    return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          disabled={isSelf(user.id)}
                          aria-label={`Select ${user.full_name}`}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3">
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
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor}`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.member_since}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/admin/users/${user.id}`}>
                            <Button variant="outline">View</Button>
                          </Link>
                          {!isSelf(user.id) && (
                            <>
                              <Button
                                variant={user.status === 'active' ? 'warning' : 'success'}
                                onClick={() => setToggleTarget(user)}
                              >
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button variant="danger" onClick={() => setDeactivateTarget(user)}>
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Toggle status confirmation */}
      <ConfirmationModal
        isOpen={toggleTarget !== null}
        title={toggleTarget?.status === 'active' ? 'Deactivate User' : 'Activate User'}
        message={
          toggleTarget?.status === 'active'
            ? `Set ${toggleTarget?.full_name}'s account to inactive?`
            : `Set ${toggleTarget?.full_name}'s account back to active?`
        }
        confirmLabel={toggleTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={toggleTarget?.status === 'active' ? 'warning' : 'success'}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleTarget(null)}
        isProcessing={actionProcessing}
      />

      {/* Soft-delete confirmation */}
      <ConfirmationModal
        isOpen={deactivateTarget !== null}
        title="Delete User"
        message={`Delete ${deactivateTarget?.full_name ?? 'this user'}? They can be restored from the Deleted Users page.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeactivateTarget(null)}
        isProcessing={actionProcessing}
      />

      {/* Bulk delete confirmation */}
      <ConfirmationModal
        isOpen={bulkConfirmOpen}
        title="Delete Selected Users"
        message={`Delete ${selectedIds.size} selected ${selectedIds.size === 1 ? 'user' : 'users'}? They can be restored from the Deleted Users page.`}
        confirmLabel="Delete All"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
        isProcessing={actionProcessing}
      />
    </div>
  )
}

export default UsersPage
