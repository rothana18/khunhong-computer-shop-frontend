import React, { useState } from 'react'
import Card from '@/components/common/Card'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import FormInput from '@/components/common/FormInput'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatPermission, formatUserRoleBadge, formatUserStatusBadge } from '@/utils/formatters'
import { apiMessage, isAxiosError } from '@/utils/axiosError'
import { profileApi } from '@/api/profile'

// Password validator matching the API spec
const validateApiPassword = (value: string): string | undefined => {
  if (!value) return 'This field is required'
  if (value.length < 8) return 'Must be at least 8 characters'
  if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter'
  if (!/[a-z]/.test(value)) return 'Must contain at least one lowercase letter'
  if (!/\d/.test(value)) return 'Must contain at least one number'
  return undefined
}

interface PwdValues {
  current_password: string
  password: string
  password_confirmation: string
}

type PwdErrors = Partial<Record<keyof PwdValues, string>>
type PwdTouched = Partial<Record<keyof PwdValues, boolean>>

const validatePwd = (v: PwdValues): PwdErrors => {
  const e: PwdErrors = {}
  if (!v.current_password) e.current_password = 'This field is required'
  const pwdErr = validateApiPassword(v.password)
  if (pwdErr) e.password = pwdErr
  if (!v.password_confirmation) {
    e.password_confirmation = 'This field is required'
  } else if (v.password !== v.password_confirmation) {
    e.password_confirmation = 'Passwords do not match'
  }
  return e
}

const ProfilePage: React.FC = () => {
  usePageTitle('My Profile')
  const { state } = useAuth()
  const user = state.user

  const [pwdModal, setPwdModal] = useState(false)
  const [pwdValues, setPwdValues] = useState<PwdValues>({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [pwdErrors, setPwdErrors] = useState<PwdErrors>({})
  const [pwdTouched, setPwdTouched] = useState<PwdTouched>({})
  const [processing, setProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // auth guard actually prevents this case
  if (!user) return null

  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
  const displayName = user.full_name ?? `${user.first_name} ${user.last_name}`

  const { label: roleLabel, className: roleClassName } = formatUserRoleBadge(user.role)
  const statusBadge = user.status ? formatUserStatusBadge(user.status) : null

  const openPwdModal = () => {
    setPwdValues({ current_password: '', password: '', password_confirmation: '' })
    setPwdErrors({})
    setPwdTouched({})
    setPwdModal(true)
  }

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
    const allTouched: PwdTouched = {
      current_password: true,
      password: true,
      password_confirmation: true,
    }
    setPwdTouched(allTouched)
    const errs = validatePwd(pwdValues)
    setPwdErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setProcessing(true)
    try {
      await profileApi.changePassword(pwdValues)
      setPwdModal(false)
      setActionSuccess('Password updated successfully.')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const fieldErr = err.response.data?.errors?.current_password?.[0]
        if (fieldErr) {
          setPwdErrors((prev) => ({ ...prev, current_password: fieldErr }))
          setPwdTouched((prev) => ({ ...prev, current_password: true }))
          return
        }
      }
      setActionError(apiMessage(err, 'Failed to change password'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="overflow-y-auto">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Profile</h1>

      {actionError && (
        <Alert type="error" message={actionError} onClose={() => setActionError(null)} />
      )}
      {actionSuccess && (
        <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess(null)} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Personal Information">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">First name</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{user.first_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last name</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{user.last_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="mt-0.5 flex items-center gap-2 font-medium text-gray-900">
                  {user.email}
                  {user.email_verified && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  )}
                </dd>
              </div>
              {user.phone && (
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{user.phone}</dd>
                </div>
              )}
              {user.member_since && (
                <div>
                  <dt className="text-gray-500">Member since</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{user.member_since}</dd>
                </div>
              )}
              {statusBadge && (
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="mt-0.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {user.permissions.length > 0 && (
            <Card title="Permissions">
              <div className="flex flex-wrap gap-2">
                {/* show sorted alphabetically */}
                {[...user.permissions].sort().map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {formatPermission(p)}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* right column: avatar summary + security actions */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
                {initials}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{displayName}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-medium ${roleClassName}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Security">
            <Button variant="secondary" fullWidth onClick={openPwdModal}>
              Change Password
            </Button>
          </Card>
        </div>
      </div>

      {/* ── Change Password Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={pwdModal} onClose={() => setPwdModal(false)} title="Change Password" size="sm">
        <form onSubmit={handlePwdSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Current Password"
            name="current_password"
            type="password"
            value={pwdValues.current_password}
            onChange={handlePwdChange}
            onBlur={handlePwdBlur}
            error={pwdErrors.current_password}
            touched={pwdTouched.current_password}
            required
            showPasswordToggle
            autoComplete="current-password"
          />
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
            label="Confirm New Password"
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
    </div>
  )
}

export default ProfilePage
