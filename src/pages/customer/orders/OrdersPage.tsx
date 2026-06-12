import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { useInfiniteList } from '@/hooks/useInfiniteList'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Button from '@/components/common/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUSES,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUSES,
} from '@/utils/constants'
import type { Order, OrderStatus } from '@/types'
import { usePageTitle } from '@/hooks/usePageTitle'

const OrdersPage: React.FC = () => {
  usePageTitle('My Orders')
  const [filters, setFilters] = useState({ status: '' as OrderStatus | '', date: '' })

  const fetcher = useCallback(
    (page: number) =>
      ordersApi.list({
        page,
        per_page: 15,
        status: filters.status || undefined,
        date: filters.date || undefined,
      }),
    [filters]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, total } = useInfiniteList<Order>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <Link to="/cart">
          <Button>New Order</Button>
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as OrderStatus | '' }))
          }
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUSES).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          Date
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </label>
        {(filters.status !== '' || filters.date !== '') && (
          <button
            type="button"
            onClick={() => setFilters({ status: '', date: '' })}
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="h-4 w-16 rounded bg-gray-200" />
                  <div className="h-5 w-20 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {total > 0 && <p className="mb-3 text-sm text-gray-500">{total} orders</p>}
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No orders found.</p>
            ) : (
              items.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">#{order.invoice_no}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{formatDate(order.created_at)}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <div className="mt-1 flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                        >
                          {ORDER_STATUSES[order.status]}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
                        >
                          {PAYMENT_STATUSES[order.payment_status]}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
            <div ref={sentinelRef} />
            {isFetchingMore && <Loading className="py-6" />}
          </div>
        </>
      )}
    </div>
  )
}

export default OrdersPage
