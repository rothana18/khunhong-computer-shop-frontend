import React, { useRef, useState } from 'react'
import Card from '@/components/common/Card'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import FormInput from '@/components/common/FormInput'
import AppImage from '@/components/common/AppImage'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  formatPermission,
  formatUserRoleBadge,
  formatUserStatusBadge,
  imageUrl,
} from '@/utils/formatters'
import { apiMessage, isAxiosError } from '@/utils/axiosError'
import { profileApi } from '@/api/profile'
import {
  validateEmail,
  validateMaxLength,
  validatePhone,
  validateRequired,
} from '@/utils/validation'

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

interface ProfileValues {
  first_name: string
  last_name: string
  email: string
  phone: string
}

type ProfileErrors = Partial<Record<keyof ProfileValues, string>>
type ProfileTouched = Partial<Record<keyof ProfileValues, boolean>>

const validateProfile = (v: ProfileValues): ProfileErrors => {
  const e: ProfileErrors = {}
  const fn = validateRequired(v.first_name)
  if (!fn.valid) e.first_name = fn.message
  else {
    const r = validateMaxLength(v.first_name, 255)
    if (!r.valid) e.first_name = r.message
  }
  const ln = validateRequired(v.last_name)
  if (!ln.valid) e.last_name = ln.message
  else {
    const r = validateMaxLength(v.last_name, 255)
    if (!r.valid) e.last_name = r.message
  }
  const em = validateEmail(v.email)
  if (!em.valid) e.email = em.message
  if (v.phone.trim()) {
    const ph = validatePhone(v.phone)
    if (!ph.valid) e.phone = ph.message
  }
  return e
}

const ProfilePage: React.FC = () => {
  usePageTitle('My Profile')
  const { state, updateUser } = useAuth()
  const user = state.user

  // ── Password modal ────────────────────────────────────────────────────────
  const [pwdModal, setPwdModal] = useState(false)
  const [pwdValues, setPwdValues] = useState<PwdValues>({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [pwdErrors, setPwdErrors] = useState<PwdErrors>({})
  const [pwdTouched, setPwdTouched] = useState<PwdTouched>({})
  const [processing, setProcessing] = useState(false)

  // ── Profile edit modal ────────────────────────────────────────────────────
  const [profileModal, setProfileModal] = useState(false)
  const [profileValues, setProfileValues] = useState<ProfileValues>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [profileTouched, setProfileTouched] = useState<ProfileTouched>({})

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // auth guard actually prevents this case
  if (!user) return null

  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
  const displayName = user.full_name ?? `${user.first_name} ${user.last_name}`
  const avatarSrc = imageUrl(user.profile_image_url)

  const { label: roleLabel, className: roleClassName } = formatUserRoleBadge(user.role)
  const statusBadge = user.status ? formatUserStatusBadge(user.status) : null

  // ── Password handlers ─────────────────────────────────────────────────────
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

  // ── Profile edit handlers ─────────────────────────────────────────────────
  const openProfileModal = () => {
    setProfileValues({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? '',
    })
    setProfileErrors({})
    setProfileTouched({})
    setProfileModal(true)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updated = { ...profileValues, [name]: value }
    setProfileValues(updated)
    if (profileTouched[name as keyof ProfileValues]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: validateProfile(updated)[name as keyof ProfileValues],
      }))
    }
  }

  const handleProfileBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setProfileTouched((prev) => ({ ...prev, [name]: true }))
    setProfileErrors((prev) => ({
      ...prev,
      [name]: validateProfile(profileValues)[name as keyof ProfileValues],
    }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched: ProfileTouched = {
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
    }
    setProfileTouched(allTouched)
    const errs = validateProfile(profileValues)
    setProfileErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setProcessing(true)
    try {
      const res = await profileApi.updateProfile({
        first_name: profileValues.first_name,
        last_name: profileValues.last_name,
        email: profileValues.email,
        phone: profileValues.phone || null,
      })
      updateUser(res.data.data)
      setProfileModal(false)
      setActionSuccess('Profile updated successfully.')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const apiErrors: Record<string, string[]> = err.response.data?.errors ?? {}
        const fieldErrors: ProfileErrors = {}
        const fieldTouched: ProfileTouched = {}
        for (const key of ['first_name', 'last_name', 'email', 'phone'] as const) {
          if (apiErrors[key]?.[0]) {
            fieldErrors[key] = apiErrors[key][0]
            fieldTouched[key] = true
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setProfileErrors((prev) => ({ ...prev, ...fieldErrors }))
          setProfileTouched((prev) => ({ ...prev, ...fieldTouched }))
          return
        }
      }
      setActionError(apiMessage(err, 'Failed to update profile'))
    } finally {
      setProcessing(false)
    }
  }

  // ── Avatar handler ────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setAvatarUploading(true)
    setActionError(null)
    try {
      const res = await profileApi.updateAvatar(file)
      updateUser(res.data.data)
      setActionSuccess('Avatar updated successfully.')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const imgErr = err.response.data?.errors?.profile_image?.[0]
        if (imgErr) {
          setActionError(imgErr)
          return
        }
      }
      setActionError(apiMessage(err, 'Failed to upload avatar'))
    } finally {
      setAvatarUploading(false)
    }
  }

  const avatarInitials = (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
      {initials}
    </div>
  )

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
          <Card
            title="Personal Information"
            headerAction={
              <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={openProfileModal}>
                Edit
              </Button>
            }
          >
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
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}
                    >
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

        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center gap-3 py-2">
              <AppImage
                src={avatarSrc}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover"
                fallback={avatarInitials}
              />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{displayName}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-medium ${roleClassName}`}
                >
                  {roleLabel}
                </span>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                variant="outline"
                fullWidth
                onClick={() => avatarInputRef.current?.click()}
                isLoading={avatarUploading}
                loadingLabel="Uploading…"
                disabled={avatarUploading}
              >
                {avatarSrc ? 'Change Avatar' : 'Upload Avatar'}
              </Button>
            </div>
          </Card>

          <Card title="Security">
            <Button variant="secondary" fullWidth onClick={openPwdModal}>
              Change Password
            </Button>
          </Card>
        </div>
      </div>

      {/* ── Edit Profile Modal ────────────────────────────────────────────────── */}
      <Modal
        isOpen={profileModal}
        onClose={() => setProfileModal(false)}
        title="Edit Profile"
        size="sm"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="First name"
              name="first_name"
              value={profileValues.first_name}
              onChange={handleProfileChange}
              onBlur={handleProfileBlur}
              error={profileErrors.first_name}
              touched={profileTouched.first_name}
              required
              autoComplete="given-name"
            />
            <FormInput
              label="Last name"
              name="last_name"
              value={profileValues.last_name}
              onChange={handleProfileChange}
              onBlur={handleProfileBlur}
              error={profileErrors.last_name}
              touched={profileTouched.last_name}
              required
              autoComplete="family-name"
            />
          </div>
          <FormInput
            label="Email address"
            name="email"
            type="email"
            value={profileValues.email}
            onChange={handleProfileChange}
            onBlur={handleProfileBlur}
            error={profileErrors.email}
            touched={profileTouched.email}
            required
            autoComplete="email"
          />
          <FormInput
            label="Phone (optional)"
            name="phone"
            type="tel"
            value={profileValues.phone}
            onChange={handleProfileChange}
            onBlur={handleProfileBlur}
            error={profileErrors.phone}
            touched={profileTouched.phone}
            autoComplete="tel"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setProfileModal(false)}
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
