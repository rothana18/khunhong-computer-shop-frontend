import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { usersApi } from '@/api/users'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import Modal from '@/components/common/Modal'
import FormInput from '@/components/common/FormInput'
import AppImage from '@/components/common/AppImage'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { imageUrl, formatDate, formatPermission, formatUserRoleBadge, formatUserStatusBadge } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import { USER_ROLE_IDS, USER_ROLES } from '@/utils/constants'
import { validateEmail, validateRequired } from '@/utils/validation'
import type { ManagedUser, UserRoleSlug } from '@/types'

// Password validator matching the API spec
const validateApiPassword = (value: string): string | undefined => {
  if (!value) return 'This field is required'
  if (value.length < 8) return 'Must be at least 8 characters'
  if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter'
  if (!/[a-z]/.test(value)) return 'Must contain at least one lowercase letter'
  if (!/\d/.test(value)) return 'Must contain at least one number'
  return undefined
}

// ─── Edit-profile form ────────────────────────────────────────────────────────

interface EditValues {
  first_name: string
  last_name: string
  email: string
  phone: string
  status: string
}

type EditErrors = Partial<Record<keyof EditValues, string>>
type EditTouched = Partial<Record<keyof EditValues, boolean>>

const validateEdit = (v: EditValues): EditErrors => {
  const e: EditErrors = {}
  const req = (k: keyof EditValues) => {
    const r = validateRequired(v[k])
    if (!r.valid) e[k] = r.message
  }
  req('first_name')
  req('last_name')
  req('email')
  const emailR = validateEmail(v.email)
  if (!emailR.valid) e.email = emailR.message
  return e
}

// ─── Change-password form ─────────────────────────────────────────────────────

interface PwdValues {
  password: string
  password_confirmation: string
}

type PwdErrors = Partial<Record<keyof PwdValues, string>>
type PwdTouched = Partial<Record<keyof PwdValues, boolean>>

const validatePwd = (v: PwdValues): PwdErrors => {
  const e: PwdErrors = {}
  const pwdErr = validateApiPassword(v.password)
  if (pwdErr) e.password = pwdErr
  if (!v.password_confirmation) {
    e.password_confirmation = 'This field is required'
  } else if (v.password !== v.password_confirmation) {
    e.password_confirmation = 'Passwords do not match'
  }
  return e
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { state: authState } = useAuth()

  const [user, setUser] = useState<ManagedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Modal visibility
  const [editModal, setEditModal] = useState(false)
  const [roleModal, setRoleModal] = useState(false)
  const [pwdModal, setPwdModal] = useState(false)
  const [toggleConfirm, setToggleConfirm] = useState(false)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)

  const [processing, setProcessing] = useState(false)

  // ── Edit profile form state ─────────────────────────────────────────────────
  const [editValues, setEditValues] = useState<EditValues>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
  })
  const [editErrors, setEditErrors] = useState<EditErrors>({})
  const [editTouched, setEditTouched] = useState<EditTouched>({})
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  // ── Assign-role form state ──────────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState<UserRoleSlug>('customer')

  // ── Change-password form state ──────────────────────────────────────────────
  const [pwdValues, setPwdValues] = useState<PwdValues>({ password: '', password_confirmation: '' })
  const [pwdErrors, setPwdErrors] = useState<PwdErrors>({})
  const [pwdTouched, setPwdTouched] = useState<PwdTouched>({})

  usePageTitle(user ? user.full_name : undefined)

  // Revoke the previous blob URL whenever the edit-modal preview changes to a
  // new local file selection, and on unmount. API-served URLs are skipped.
  useEffect(() => {
    if (!editImagePreview?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(editImagePreview)
  }, [editImagePreview])

  const reload = () => {
    if (!id) return
    usersApi
      .getById(Number(id))
      .then((res) => setUser(res.data.data))
      .catch((err) => setActionError(apiMessage(err, 'Failed to reload user')))
  }

  useEffect(() => {
    if (!id) return
    usersApi
      .getById(Number(id))
      .then((res) => setUser(res.data.data))
      .catch((err) => setPageError(apiMessage(err, 'Failed to load user')))
      .finally(() => setLoading(false))
  }, [id])

  // Seed the edit form whenever the modal is opened
  const openEditModal = () => {
    if (!user) return
    setEditValues({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? '',
      status: user.status,
    })
    setEditErrors({})
    setEditTouched({})
    setEditImageFile(null)
    setEditImagePreview(imageUrl(user.profile_image_url))
    setEditModal(true)
  }

  const openRoleModal = () => {
    if (!user) return
    setSelectedRole((user.role as UserRoleSlug) ?? 'customer')
    setRoleModal(true)
  }

  const openPwdModal = () => {
    setPwdValues({ password: '', password_confirmation: '' })
    setPwdErrors({})
    setPwdTouched({})
    setPwdModal(true)
  }

  // ── Edit profile submit ─────────────────────────────────────────────────────

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const updated = { ...editValues, [name]: value }
    setEditValues(updated)
    if (editTouched[name as keyof EditValues]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: validateEdit(updated)[name as keyof EditValues],
      }))
    }
  }

  const handleEditBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target
    setEditTouched((prev) => ({ ...prev, [name]: true }))
    setEditErrors((prev) => ({
      ...prev,
      [name]: validateEdit(editValues)[name as keyof EditValues],
    }))
  }

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.keys(editValues).reduce(
      (a, k) => ({ ...a, [k]: true }),
      {} as EditTouched
    )
    setEditTouched(allTouched)
    const errs = validateEdit(editValues)
    setEditErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setProcessing(true)
    try {
      const payload = new FormData()
      payload.append('_method', 'PUT')
      payload.append('first_name', editValues.first_name)
      payload.append('last_name', editValues.last_name)
      payload.append('email', editValues.email)
      if (editValues.phone) payload.append('phone', editValues.phone)
      payload.append('status', editValues.status)
      if (editImageFile) payload.append('profile_image', editImageFile)

      await usersApi.update(Number(id), payload)
      setEditModal(false)
      setActionSuccess('Profile updated successfully.')
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to update profile'))
    } finally {
      setProcessing(false)
    }
  }

  // ── Assign role submit ──────────────────────────────────────────────────────

  const handleAssignRole = async () => {
    setProcessing(true)
    try {
      await usersApi.assignRole(Number(id), USER_ROLE_IDS[selectedRole])
      setRoleModal(false)
      setActionSuccess('Role updated successfully.')
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to assign role'))
    } finally {
      setProcessing(false)
    }
  }

  // ── Change password submit ──────────────────────────────────────────────────

  const handlePwdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updated = { ...pwdValues, [name]: value }
    setPwdValues(updated)
    if (pwdTouched[name as keyof PwdValues]) {
      setPwdErrors((prev) => ({
        ...prev,
        [name]: validatePwd(updated)[name as keyof PwdValues],
      }))
    }
  }

  const handlePwdBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setPwdTouched((prev) => ({ ...prev, [name]: true }))
    setPwdErrors((prev) => ({
      ...prev,
      [name]: validatePwd(pwdValues)[name as keyof PwdValues],
    }))
  }

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: PwdTouched = { password: true, password_confirmation: true }
    setPwdTouched(allTouched)
    const errs = validatePwd(pwdValues)
    setPwdErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setProcessing(true)
    try {
      await usersApi.changePassword(Number(id), {
        password: pwdValues.password,
        password_confirmation: pwdValues.password_confirmation,
      })
      setPwdModal(false)
      setActionSuccess('Password changed successfully.')
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to change password'))
    } finally {
      setProcessing(false)
    }
  }

  // ── Toggle status ───────────────────────────────────────────────────────────

  const handleToggleStatus = async () => {
    setProcessing(true)
    try {
      await usersApi.toggleStatus(Number(id))
      setToggleConfirm(false)
      reload()
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to toggle status'))
    } finally {
      setProcessing(false)
    }
  }

  // ── Soft-delete (deactivate) ────────────────────────────────────────────────

  const handleDeactivate = async () => {
    setProcessing(true)
    try {
      await usersApi.delete(Number(id))
      navigate('/admin/users', {
        state: { success: 'User deleted. They can be restored from Deleted Users.' },
      })
    } catch (err) {
      setActionError(apiMessage(err, 'Failed to deactivate user'))
      setDeactivateConfirm(false)
      setProcessing(false)
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  if (loading) return <Loading className="py-20" />
  if (pageError) return <Alert type="error" message={pageError} />
  if (!user) return null

  const isSelf = authState.user?.id === user.id
  const { label: roleLabel, className: roleColor } = formatUserRoleBadge(user.role)
  const { label: statusLabel, className: statusColor } = formatUserStatusBadge(user.status)

  return (
    <div className="overflow-y-auto">
      <div className="mb-4">
        <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">
          ← Back to users
        </Link>
      </div>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />
      )}

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column ────────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Profile card */}
          <Card title="Profile">
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              {/* Avatar */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
                <AppImage
                  src={imageUrl(user.profile_image_url)}
                  alt=""
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full items-center justify-center">
                      <FiUser className="h-8 w-8 text-gray-300" />
                    </div>
                  }
                />
              </div>

              {/* Details */}
              <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Full name</dt>
                  <dd className="font-medium text-gray-900">{user.full_name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="break-all text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{user.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Member since</dt>
                  <dd className="text-gray-900">{user.member_since}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email verified</dt>
                  <dd className="text-gray-900">{user.email_verified ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-gray-900">{formatDate(user.created_at)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Addresses */}
          <Card title="Addresses">
            {user.addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No saved addresses.</p>
            ) : (
              <div className="space-y-3">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="rounded border border-gray-100 bg-gray-50 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {addr.full_name}
                          {addr.is_default && (
                            <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-gray-500">{addr.phone}</p>
                        <p className="text-gray-500">
                          {[
                            addr.street_house,
                            addr.commune_sangkat,
                            addr.district_khan,
                            addr.province,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column: actions ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <Card title="Role">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor}`}>
              {roleLabel}
            </span>
            <Button variant="secondary" fullWidth className="mt-3" onClick={openRoleModal}>
              Change Role
            </Button>
          </Card>
          {user.permissions.length > 0 && (
            <Card title="Permissions">
              <div className="flex flex-wrap gap-2">
                {[...user.permissions].sort().map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {formatPermission(p)}
                  </span>
                ))}
              </div>
            </Card>
          )}
          <Button fullWidth onClick={openEditModal}>
            Edit Profile
          </Button>
          <Button variant="secondary" fullWidth onClick={openPwdModal}>
            Change Password
          </Button>

          {!isSelf && (
            <>
              <Button
                variant={user.status === 'active' ? 'warning' : 'success'}
                fullWidth
                onClick={() => setToggleConfirm(true)}
              >
                {user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </Button>
              <Button variant="danger" fullWidth onClick={() => setDeactivateConfirm(true)}>
                Delete User
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profile" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
          {/* Profile image */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
              <AppImage
                src={editImagePreview}
                alt=""
                className="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <FiUser className="h-6 w-6 text-gray-300" />
                  </div>
                }
              />
            </div>
            <div>
              <input
                ref={editFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleEditImageChange}
              />
              <Button type="button" variant="outline" onClick={() => editFileRef.current?.click()}>
                {editImagePreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <p className="mt-1 text-xs text-gray-400">JPEG, PNG or WebP · max 2 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              name="first_name"
              value={editValues.first_name}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              error={editErrors.first_name}
              touched={editTouched.first_name}
              required
            />
            <FormInput
              label="Last Name"
              name="last_name"
              value={editValues.last_name}
              onChange={handleEditChange}
              onBlur={handleEditBlur}
              error={editErrors.last_name}
              touched={editTouched.last_name}
              required
            />
          </div>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={editValues.email}
            onChange={handleEditChange}
            onBlur={handleEditBlur}
            error={editErrors.email}
            touched={editTouched.email}
            required
          />
          <FormInput
            label="Phone"
            name="phone"
            type="tel"
            value={editValues.phone}
            onChange={handleEditChange}
            onBlur={handleEditBlur}
            placeholder="0XXXXXXXXX or +855XXXXXXXXX"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={editValues.status}
              onChange={handleEditChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setEditModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={processing} loadingLabel="Saving…">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Role Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={roleModal} onClose={() => setRoleModal(false)} title="Change Role" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRoleSlug)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              {(Object.entries(USER_ROLES) as [UserRoleSlug, string][]).map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => setRoleModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              isLoading={processing}
              loadingLabel="Saving…"
              disabled={selectedRole === (user.role as UserRoleSlug)}
            >
              Assign Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Change Password Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={pwdModal} onClose={() => setPwdModal(false)} title="Change Password" size="sm">
        <form onSubmit={handlePwdSubmit} className="space-y-4" noValidate>
          <FormInput
            label="New Password"
            name="password"
            type="password"
            value={pwdValues.password}
            onChange={handlePwdChange}
            onBlur={handlePwdBlur}
            error={pwdErrors.password}
            touched={pwdTouched.password}
            required
            showPasswordToggle
            autoComplete="new-password"
          />
          <FormInput
            label="Confirm Password"
            name="password_confirmation"
            type="password"
            value={pwdValues.password_confirmation}
            onChange={handlePwdChange}
            onBlur={handlePwdBlur}
            error={pwdErrors.password_confirmation}
            touched={pwdTouched.password_confirmation}
            required
            showPasswordToggle
            autoComplete="new-password"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setPwdModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={processing} loadingLabel="Updating…">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Toggle Status Confirmation ────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={toggleConfirm}
        title={user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
        message={
          user.status === 'active'
            ? `Set ${user.full_name}'s account to inactive?`
            : `Set ${user.full_name}'s account back to active?`
        }
        confirmLabel={user.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={user.status === 'active' ? 'warning' : 'success'}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleConfirm(false)}
        isProcessing={processing}
      />

      {/* ── Delete (soft-delete) Confirmation ────────────────────────────────── */}
      <ConfirmationModal
        isOpen={deactivateConfirm}
        title="Delete User"
        message={`Delete ${user.full_name}? They can be restored from the Deleted Users page.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateConfirm(false)}
        isProcessing={processing}
      />
    </div>
  )
}

export default AdminUserDetailPage
