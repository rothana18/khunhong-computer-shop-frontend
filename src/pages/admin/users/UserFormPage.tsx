import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { usersApi } from '@/api/users'
import { usePageTitle } from '@/hooks/usePageTitle'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import FormInput from '@/components/common/FormInput'
import AppImage from '@/components/common/AppImage'
import { apiMessage } from '@/utils/axiosError'
import { validateEmail, validateRequired } from '@/utils/validation'
import { USER_ROLE_IDS, USER_ROLES } from '@/utils/constants'
import type { UserRoleSlug } from '@/types'

// Password validator matching the API spec:
// min 8 chars, uppercase, lowercase, number
const validateApiPassword = (value: string): string | undefined => {
  if (!value) return 'This field is required'
  if (value.length < 8) return 'Must be at least 8 characters'
  if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter'
  if (!/[a-z]/.test(value)) return 'Must contain at least one lowercase letter'
  if (!/\d/.test(value)) return 'Must contain at least one number'
  return undefined
}

interface FormValues {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  role: UserRoleSlug
  phone: string
  // optional initial address
  province: string
  district_khan: string
  commune_sangkat: string
  street_house: string
}

const initial: FormValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'customer',
  phone: '',
  province: '',
  district_khan: '',
  commune_sangkat: '',
  street_house: '',
}

type FormErrors = Partial<Record<keyof FormValues, string>>
type TouchedMap = Partial<Record<keyof FormValues, boolean>>

const validate = (v: FormValues): FormErrors => {
  const e: FormErrors = {}

  const req = (k: keyof FormValues) => {
    const r = validateRequired(v[k])
    if (!r.valid) e[k] = r.message
  }

  req('first_name')
  req('last_name')
  req('email')

  const emailR = validateEmail(v.email)
  if (!emailR.valid) e.email = emailR.message

  const pwdErr = validateApiPassword(v.password)
  if (pwdErr) e.password = pwdErr

  if (!v.password_confirmation) {
    e.password_confirmation = 'This field is required'
  } else if (v.password !== v.password_confirmation) {
    e.password_confirmation = 'Passwords do not match'
  }

  return e
}

const AdminUserFormPage: React.FC = () => {
  usePageTitle('Add User')
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedMap>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddress, setShowAddress] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const updated = { ...values, [name]: value }
    setValues(updated)
    if (touched[name as keyof FormValues]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validate(updated)[name as keyof FormValues],
      }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({
      ...prev,
      [name]: validate(values)[name as keyof FormValues],
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.keys(values).reduce((a, k) => ({ ...a, [k]: true }), {} as TouchedMap)
    setTouched(allTouched)
    const errs = validate(values)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    setError(null)
    try {
      const payload = new FormData()
      payload.append('first_name', values.first_name)
      payload.append('last_name', values.last_name)
      payload.append('email', values.email)
      payload.append('password', values.password)
      payload.append('password_confirmation', values.password_confirmation)
      payload.append('role_id', String(USER_ROLE_IDS[values.role]))
      if (values.phone) payload.append('phone', values.phone)
      if (imageFile) payload.append('profile_image', imageFile)

      // Optional initial address — only send if at least the province is filled
      if (showAddress && values.province) {
        payload.append('province', values.province)
        if (values.district_khan) payload.append('district_khan', values.district_khan)
        if (values.commune_sangkat) payload.append('commune_sangkat', values.commune_sangkat)
        if (values.street_house) payload.append('street_house', values.street_house)
      }

      await usersApi.create(payload)
      navigate('/admin/users', {
        state: { success: 'User created successfully.' },
      })
    } catch (err) {
      setError(apiMessage(err, 'Failed to create user'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-y-auto">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add User</h1>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3"
        noValidate
      >
        {/* Left: main fields */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Account Info">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  name="first_name"
                  value={values.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.first_name}
                  touched={touched.first_name}
                  required
                />
                <FormInput
                  label="Last Name"
                  name="last_name"
                  value={values.last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.last_name}
                  touched={touched.last_name}
                  required
                />
              </div>
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                touched={touched.email}
                required
                autoComplete="off"
              />
              <FormInput
                label="Phone"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.phone}
                touched={touched.phone}
                placeholder="0XXXXXXXXX or +855XXXXXXXXX"
              />
            </div>
          </Card>

          <Card title="Password">
            <div className="space-y-4">
              <FormInput
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                touched={touched.password}
                required
                showPasswordToggle
                autoComplete="new-password"
              />
              <FormInput
                label="Confirm Password"
                name="password_confirmation"
                type="password"
                value={values.password_confirmation}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password_confirmation}
                touched={touched.password_confirmation}
                required
                showPasswordToggle
                autoComplete="new-password"
              />
            </div>
          </Card>

          {/* Optional initial address */}
          <div>
            <button
              type="button"
              onClick={() => setShowAddress((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-800"
            >
              {showAddress ? '▾' : '▸'} {showAddress ? 'Hide' : 'Add'} Initial Address (optional)
            </button>

            {showAddress && (
              <Card className="mt-3">
                <div className="space-y-4">
                  <FormInput
                    label="Province"
                    name="province"
                    value={values.province}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="District / Khan"
                      name="district_khan"
                      value={values.district_khan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <FormInput
                      label="Commune / Sangkat"
                      name="commune_sangkat"
                      value={values.commune_sangkat}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  <FormInput
                    label="Street & House Number"
                    name="street_house"
                    value={values.street_house}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Profile image */}
          <Card title="Profile Image">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="space-y-2">
                <AppImage
                  src={imagePreview}
                  alt="Preview"
                  className="mx-auto block aspect-square max-h-32 w-full rounded-full object-cover"
                  fallback={
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
                      <FiUser className="h-12 w-12 text-gray-300" />
                    </div>
                  }
                />
                <Button
                  variant="outline"
                  fullWidth
                  type="button"
                  onClick={() => fileRef.current?.click()}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                  <FiUser className="h-10 w-10 text-gray-300" />
                </div>
                <Button
                  variant="outline"
                  fullWidth
                  type="button"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload Image
                </Button>
              </div>
            )}
          </Card>

          {/* Role */}
          <Card title="Role">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role <span className="ml-1 text-red-500">*</span>
              </label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                onBlur={handleBlur}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {(Object.entries(USER_ROLES) as [UserRoleSlug, string][]).map(([slug, label]) => (
                  <option key={slug} value={slug}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Button type="submit" fullWidth isLoading={saving} loadingLabel="Creating…">
            Create User
          </Button>
          <Button
            variant="outline"
            fullWidth
            type="button"
            onClick={() => navigate('/admin/users')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminUserFormPage
