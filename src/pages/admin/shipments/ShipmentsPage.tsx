import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { shipmentsApi } from '@/api/shipments'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import { formatDate } from '@/utils/formatters'
import { SHIPMENT_STATUS_COLORS, SHIPMENT_STATUSES } from '@/utils/constants'
import type { Shipment, ShipmentSummary } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const AdminShipmentsPage: React.FC = () => {
  usePageTitle('Shipments')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const [summary, setSummary] = useState<ShipmentSummary | null>(null)

  useEffect(() => {
    shipmentsApi.summary().then((res) => setSummary(res.data.data))
  }, [])

  const fetcher = useCallback(
    (page: number) => shipmentsApi.list({ page, per_page: 20, search: query || undefined }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef } = useInfiniteList<Shipment>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              { label: 'In Transit', value: summary.in_transit, color: 'text-blue-700' },
              { label: 'Ready to Ship', value: summary.ready_to_ship, color: 'text-amber-600' },
              { label: 'Delivered Today', value: summary.delivered_today, color: 'text-green-600' },
              { label: 'Cancelled', value: summary.cancelled_total, color: 'text-red-600' },
            ] as const
          ).map((s) => (
            <Card key={s.label}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <label className="sr-only" htmlFor="shipment-search">
          Search shipments
        </label>
        <input
          id="shipment-search"
          type="search"
          placeholder="Search tracking, carrier, invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loading className="py-20" />
      ) : (
        <div>
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No shipments found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg bg-white shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tracking #</th>
                    <th className="px-4 py-3 font-medium">Carrier</th>
                    <th className="px-4 py-3 font-medium">Ship Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {shipment.tracking_number}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{shipment.carrier}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(shipment.ship_date)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SHIPMENT_STATUS_COLORS[shipment.status]}`}
                        >
                          {SHIPMENT_STATUSES[shipment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/shipments/${shipment.id}`}>
                          <Button variant="outline">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div ref={sentinelRef} />
          {isFetchingMore && <Loading className="py-6" />}
        </div>
      )}
    </div>
  )
}

export default AdminShipmentsPage
