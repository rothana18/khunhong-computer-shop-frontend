import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import FormInput from '@/components/common/FormInput'
import { apiMessage } from '@/utils/axiosError'
import {
  validateMaxLength,
  validateNonNegativeNumber,
  validatePositiveNumber,
  validateRequired,
} from '@/utils/validation'
import AppImage from '@/components/common/AppImage'
import { imageUrl } from '@/utils/formatters'
import type { Category, Product } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

interface FormValues {
  name: string
  brand: string
  sku: string
  category_id: string
  price: string
  discount_price: string
  stock: string
  short_description: string
  description: string
  status: 'active' | 'inactive'
  is_featured: boolean
}

const initial: FormValues = {
  name: '',
  brand: '',
  sku: '',
  category_id: '',
  price: '',
  discount_price: '',
  stock: '',
  short_description: '',
  description: '',
  status: 'active',
  is_featured: false,
}

const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Revoke the previous blob URL whenever the preview changes to a new local
  // file selection, and on unmount. API-served URLs (http/https) are skipped.
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
    Promise.all([categoriesApi.listAll(), productsApi.getById(Number(id))])
      .then(([cats, prodRes]) => {
        setCategories(cats)
        const p = prodRes.data.data
        setProduct(p)
        const matched = cats.find((c) => c.id === p.category?.id)
        setValues({
          name: p.name,
          brand: p.brand.name,
          sku: p.sku,
          category_id: matched ? String(matched.id) : '',
          price: String(p.price),
          discount_price: p.discount_price ? String(p.discount_price) : '',
          stock: String(p.stock_quantity),
          short_description: p.short_description ?? '',
          description: p.description ?? '',
          status: p.status,
          is_featured: p.is_featured,
        })
        if (p.image_url) setImagePreview(imageUrl(p.image_url))
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false))
  }, [id])

  const validate = (v: FormValues): Partial<Record<keyof FormValues, string>> => {
    const e: Partial<Record<keyof FormValues, string>> = {}
    const req = (k: keyof FormValues) => {
      const r = validateRequired(String(v[k]))
      if (!r.valid) e[k] = r.message
    }
    req('name')
    req('brand')
    req('sku')
    req('price')
    req('stock')
    if (!v.category_id) e.category_id = 'Please select a category'
    const nameMax = validateMaxLength(v.name, 255)
    if (!nameMax.valid) e.name = nameMax.message
    const pr = validatePositiveNumber(v.price)
    if (!pr.valid) e.price = pr.message
    if (v.discount_price) {
      const dr = validatePositiveNumber(v.discount_price)
      if (!dr.valid) e.discount_price = dr.message
      else if (parseFloat(v.discount_price) >= parseFloat(v.price)) {
        e.discount_price = 'Discount price must be less than the regular price'
      }
    }
    const st = validateNonNegativeNumber(v.stock)
    if (!st.valid) e.stock = st.message
    return e
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target
    // Checkboxes expose their boolean state via `checked`, not `value`.
    const value =
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value
    const updated = { ...values, [name]: value }
    setValues(updated as FormValues)
    if (touched[name as keyof FormValues]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validate(updated as FormValues)[name as keyof FormValues],
      }))
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(values)[name as keyof FormValues] }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.keys(values).reduce(
      (a, k) => ({ ...a, [k]: true }),
      {} as Record<string, boolean>
    )
    setTouched(allTouched as typeof touched)
    const errs = validate(values)
    setErrors(errs)
    if (Object.values(errs).some(Boolean) || !values.category_id) return

    setSaving(true)
    setError(null)
    try {
      const payload = new FormData()
      const append = (k: string, v: string | File) => payload.append(k, v)

      append('name', values.name)
      append('brand', values.brand)
      append('sku', values.sku)
      append('category_id', values.category_id)
      append('price', values.price)
      if (values.discount_price) append('discount_price', values.discount_price)
      append('stock', values.stock)
      if (values.short_description) append('short_description', values.short_description)
      if (values.description) append('description', values.description)
      append('status', values.status)
      append('is_featured', values.is_featured ? '1' : '0')
      if (imageFile) append('image', imageFile)

      if (isEdit && id) {
        payload.append('_method', 'PUT')
        await productsApi.update(Number(id), payload)
      } else {
        await productsApi.create(payload)
      }

      navigate('/admin/products', {
        state: {
          success: isEdit ? 'Product updated successfully.' : 'Product created successfully.',
        },
      })
    } catch (err) {
      setError(apiMessage(err, 'Failed to save product'))
    } finally {
      setSaving(false)
    }
  }

  usePageTitle(isEdit ? (product?.name ? `Edit: ${product.name}` : 'Edit Product') : 'Add Product')

  if (loading) return <Loading className="py-20" />

  return (
    <div className="overflow-y-auto">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? `Edit: ${product?.name ?? ''}` : 'Add Product'}
      </h1>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3"
        noValidate
      >
        <div className="space-y-6 lg:col-span-2">
          <Card title="Basic Info">
            <div className="space-y-4">
              <FormInput
                label="Product Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Brand"
                  name="brand"
                  value={values.brand}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.brand}
                  touched={touched.brand}
                  required
                />
                <FormInput
                  label="SKU"
                  name="sku"
                  value={values.sku}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.sku}
                  touched={touched.sku}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={values.category_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && touched.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Pricing & Stock">
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Price ($)"
                name="price"
                type="number"
                value={values.price}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.price}
                touched={touched.price}
                required
              />
              <FormInput
                label="Discount Price ($)"
                name="discount_price"
                type="number"
                value={values.discount_price}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.discount_price}
                touched={touched.discount_price}
              />
              <FormInput
                label="Stock"
                name="stock"
                type="number"
                value={values.stock}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.stock}
                touched={touched.stock}
                required
              />
            </div>
          </Card>

          <Card title="Description">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Short Description</label>
                <textarea
                  name="short_description"
                  value={values.short_description}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Description</label>
                <textarea
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  rows={6}
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
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <div className="space-y-2">
                <AppImage
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 w-full rounded object-contain"
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
            <div className="space-y-3">
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={values.is_featured}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Featured product
              </label>
            </div>
          </Card>

          <Button type="submit" fullWidth isLoading={saving} loadingLabel="Saving...">
            {isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button
            variant="outline"
            fullWidth
            type="button"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminProductFormPage
