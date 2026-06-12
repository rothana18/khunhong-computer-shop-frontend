import { useCallback, useEffect, useRef, useState } from 'react'
import type { PaginatedApiResponse } from '@/types'
import { apiMessage } from '@/utils/axiosError'

interface UseInfiniteListOptions<T> {
  fetcher: (page: number) => Promise<{ data: PaginatedApiResponse<T> }>
}

interface UseInfiniteListResult<T> {
  items: T[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  total: number
  error: string | null
  sentinelRef: React.RefObject<HTMLDivElement | null>
  refresh: () => void
}

export function useInfiniteList<T>({
  fetcher,
}: UseInfiniteListOptions<T>): UseInfiniteListResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const currentPage = useRef(1)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const fetchingRef = useRef(false)
  // Incremented on every refresh so that responses from superseded requests
  // are silently discarded instead of being committed to state.
  const generationRef = useRef(0)

  const loadPage = useCallback(
    async (page: number) => {
      if (fetchingRef.current) return
      fetchingRef.current = true
      const gen = ++generationRef.current

      if (page === 1) setIsLoading(true)
      else setIsFetchingMore(true)

      try {
        const res = await fetcher(page)
        // A newer request has started (e.g. refresh was called while this was
        // in flight). Discard this response; the newer request owns state.
        if (gen !== generationRef.current) return
        const { data: newItems, meta } = res.data
        setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]))
        setTotal(meta.total)
        setHasMore(meta.current_page < meta.last_page)
        currentPage.current = meta.current_page
        setError(null)
      } catch (err) {
        if (gen !== generationRef.current) return
        setError(apiMessage(err, 'Failed to load data'))
      } finally {
        // Only the current generation clears the loading flags and releases
        // the lock; a superseded request must not interfere with the newer one.
        if (gen === generationRef.current) {
          setIsLoading(false)
          setIsFetchingMore(false)
          fetchingRef.current = false
        }
      }
    },
    [fetcher]
  )

  useEffect(() => {
    currentPage.current = 1
    setItems([])
    setHasMore(true)
    // Release the lock so the new page-1 request can proceed even if a
    // previous fetch is still in flight (its response will be discarded via
    // the generation counter above).
    fetchingRef.current = false
    loadPage(1)
  }, [refreshKey, loadPage])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
          loadPage(currentPage.current + 1)
        }
      },
      { root: null, rootMargin: '200px' }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, loadPage])

  const refresh = () => setRefreshKey((k) => k + 1)

  return {
    items,
    isLoading,
    isFetchingMore,
    hasMore,
    total,
    error,
    sentinelRef,
    refresh,
  }
}
