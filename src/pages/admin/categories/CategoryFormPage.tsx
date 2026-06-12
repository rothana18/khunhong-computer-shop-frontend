import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { categoriesApi } from '@/api/categories'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import FormInput from '@/components/common/FormInput'
import { apiMessage } from '@/utils/axiosError'
import { validateRequired } from '@/utils/validation'
import AppImage from '@/components/common/AppImage'
import { imageUrl } from '@/utils/formatters'
import type { Category } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

interface FormValues {
  name: string
  description: string
  parent_id: string
  status: 'active' | 'inactive'
}

const AdminCategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>({
    name: '',
    description: '',
    parent_id: '',
    status: 'active',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Revoke blob URLs created by URL.createObjectURL when the preview changes
  // or when the component unmounts; skip API-served URLs (http/https).
  useEffect(() => {
    if (!imagePreview?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  useEffect(() => {
    if (!id) {
      categoriesApi
        .listAll()
        .then(setCategories)
        .catch(() => setError('Failed to load categories'))
        .finally(() => setLoading(false))
      return
    }
    Promise.all([categoriesApi.listAll(), categoriesApi.getById(Number(id))])
      .then(([cats, catRes]) => {
        setCategories(cats)
        const c = catRes.data.data
        const matchedParent = c.parent_id
          ? cats.find((cat) => String(cat.id) === String(c.parent_id))
          : null
        setValues({
          name: c.name,
          description: c.description ?? '',
          parent_id: matchedParent ? String(matchedParent.id) : '',
          status: c.status,
        })
        if (c.image_url) setImagePreview(imageUrl(c.image_url))
      })
      .catch(() => setError('Failed to load category'))
      .finally(() => setLoading(false))
  }, [id])

  const validate = (v: FormValues) => {
    const e: Partial<Record<keyof FormValues, string>> = {}
    const r = validateRequired(v.name)
    if (!r.valid) e.name = r.message
    return e
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const updated = { ...values, [name]: value }
    setValues(updated)
    if (touched[name as keyof FormValues]) {
      setErrors((prev) => ({ ...prev, [name]: validate(updated)[name as keyof FormValues] }))
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(values)[name as keyof FormValues] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, description: true, parent_id: true, status: true })
    const errs = validate(values)
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSaving(true)
    setError(null)
    try {
      const payload = new FormData()
      payload.append('name', values.name)
      if (values.description) payload.append('description', values.description)
      payload.append('parent_id', values.parent_id)
      payload.append('status', values.status)
      if (imageFile) payload.append('image', imageFile)

      if (isEdit && id) {
        payload.append('_method', 'PUT')
        await categoriesApi.update(Number(id), payload)
      } else {
        await categoriesApi.create(payload)
      }

      navigate('/admin/categories', {
        state: {
          success: isEdit ? 'Category updated successfully.' : 'Category created successfully.',
        },
      })
    } catch (err) {
      setError(apiMessage(err, 'Failed to save category'))
    } finally {
      setSaving(false)
    }
  }

  usePageTitle(isEdit ? 'Edit Category' : 'Add Category')

  if (loading) return <Loading className="py-20" />

  const parentOptions = categories.filter((c) => !id || c.id !== Number(id))

  return (
    <div className="overflow-y-auto">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? 'Edit Category' : 'Add Category'}
      </h1>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3"
        noValidate
      >
        <div className="space-y-6 lg:col-span-2">
          <Card title="Category Info">
            <div className="space-y-4">
              <FormInput
                label="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                <select
                  name="parent_id"
                  value={values.parent_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Image">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setImageFile(f)
                setImagePreview(URL.createObjectURL(f))
              }}
            />
            {imagePreview ? (
              <div className="space-y-2">
                <AppImage
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 w-full rounded object-contain"
                  fallback={
                    <p className="py-4 text-center text-sm text-gray-400">Preview unavailable</p>
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
              <Button
                variant="outline"
                fullWidth
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                Upload Image
              </Button>
            )}
          </Card>

          <Card title="Settings">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={values.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </Card>

          <Button type="submit" fullWidth isLoading={saving} loadingLabel="Saving...">
            {isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
          <Button
            variant="outline"
            fullWidth
            type="button"
            onClick={() => navigate('/admin/categories')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminCategoryFormPage
