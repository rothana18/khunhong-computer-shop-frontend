import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFolder } from 'react-icons/fi'
import { categoriesApi } from '@/api/categories'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import AppImage from '@/components/common/AppImage'
import { imageUrl } from '@/utils/formatters'
import type { Category } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const CategoriesPage: React.FC = () => {
  usePageTitle('Categories')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetcher = useCallback(
    (page: number) => categoriesApi.list({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef } = useInfiniteList<Category>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      </div>

      <div className="mb-6">
        <input
          type="search"
          placeholder="Search categories..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {isLoading && <Loading className="py-20" />}
      {error && <Alert type="error" message={error} />}

      {!isLoading && (
        <div>
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No categories found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.id}`}
                  className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md"
                >
                  <div className="aspect-video bg-gray-100">
                    <AppImage
                      src={imageUrl(cat.image_url)}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full items-center justify-center">
                          <FiFolder className="h-8 w-8 text-gray-300" />
                        </div>
                      }
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900">{cat.name}</h3>
                    {cat.children && cat.children.length > 0 && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {cat.children.length} subcategories
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div ref={sentinelRef} />
          {isFetchingMore && <Loading className="py-6" />}
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
