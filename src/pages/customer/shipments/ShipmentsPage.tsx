import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { shipmentsApi } from '@/api/shipments'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import { formatDate } from '@/utils/formatters'
import { SHIPMENT_STATUS_COLORS, SHIPMENT_STATUSES } from '@/utils/constants'
import type { Shipment } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const ShipmentsPage: React.FC = () => {
  usePageTitle('My Shipments')
  const fetcher = useCallback((page: number) => shipmentsApi.list({ page, per_page: 15 }), [])

  const { items, isLoading, isFetchingMore, error, sentinelRef } = useInfiniteList<Shipment>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
      </div>

      {isLoading && <Loading className="py-20" />}
      {error && <Alert type="error" message={error} />}

      {!isLoading && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No shipments found.</p>
          ) : (
            items.map((shipment) => (
              <Link
                key={shipment.id}
                to={`/shipments/${shipment.id}`}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{shipment.tracking_number}</p>
                  <p className="text-sm text-gray-500">
                    {shipment.carrier} · {formatDate(shipment.ship_date)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}
                >
                  {SHIPMENT_STATUSES[shipment.status]}
                </span>
              </Link>
            ))
          )}
          <div ref={sentinelRef} />
          {isFetchingMore && <Loading className="py-6" />}
        </div>
      )}
    </div>
  )
}

export default ShipmentsPage
