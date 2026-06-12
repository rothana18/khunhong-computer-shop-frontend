import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiPackage } from 'react-icons/fi'
import { categoriesApi } from '@/api/categories'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, imageUrl } from '@/utils/formatters'
import { apiMessage } from '@/utils/axiosError'
import type { Category } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    categoriesApi
      .getById(Number(id))
      .then((res) => setCategory(res.data.data))
      .catch((err) => setError(apiMessage(err, 'Failed to load category')))
      .finally(() => setLoading(false))
  }, [id])

  usePageTitle(category?.name)

  if (loading) return <Loading className="py-20" />
  if (error) return <Alert type="error" message={error} />
  if (!category) return null

  return (
    <div>
      <div className="mb-4">
        <Link to="/categories" className="text-sm text-primary-600 hover:underline">
          ← Back to categories
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <AppImage
          src={imageUrl(category.image_url)}
          alt={category.name}
          className="h-16 w-16 rounded-lg object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
        </div>
      </div>

      {category.children && category.children.length > 0 && (
        <Card title="Subcategories" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                to={`/categories/${child.id}`}
                className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700 hover:bg-primary-100"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {category.products && category.products.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {category.products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md"
              >
                <div className="aspect-square bg-gray-100">
                  <AppImage
                    src={imageUrl(product.image_url)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <FiPackage className="h-10 w-10 text-gray-300" />
                      </div>
                    }
                  />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-primary-700">
                    {formatCurrency(product.discount_price ?? product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryDetailPage
