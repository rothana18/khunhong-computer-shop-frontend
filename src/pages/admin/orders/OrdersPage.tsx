import React, { useCallback, useEffect, useState } from 'react'
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

const AdminOrdersPage: React.FC = () => {
  usePageTitle('Orders')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState({ search: '', status: '' as OrderStatus | '', date: '' })

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((q) => ({ ...q, search: searchInput }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetcher = useCallback(
    (page: number) =>
      ordersApi.list({
        page,
        per_page: 20,
        search: query.search || undefined,
        status: query.status || undefined,
        date: query.date || undefined,
      }),
    [query]
  )

  const { items, isLoading, isFetchingMore, error, sentinelRef, total } = useInfiniteList<Order>({
    fetcher,
  })

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="order-search">
          Search orders
        </label>
        <input
          id="order-search"
          type="search"
          placeholder="Search invoice, phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        <label className="sr-only" htmlFor="order-status">
          Filter by status
        </label>
        <select
          id="order-status"
          value={query.status}
          onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value as OrderStatus | '' }))}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUSES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <label htmlFor="order-date" className="flex items-center gap-1.5 text-sm text-gray-600">
          Date
          <input
            id="order-date"
            type="date"
            value={query.date}
            onChange={(e) => setQuery((q) => ({ ...q, date: e.target.value }))}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </label>
        {(searchInput !== '' || query.status !== '' || query.date !== '') && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              setQuery({ search: '', status: '', date: '' })
            }}
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} />}

      {isLoading ? (
        <Loading className="py-20" />
      ) : (
        <>
          {total > 0 && <p className="mb-3 text-sm text-gray-500">{total} orders</p>}
          <div>
            {items.length === 0 ? (
              <p className="py-12 text-center text-gray-500">No orders found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Invoice #</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{order.invoice_no}</td>
                        <td className="px-4 py-3 text-gray-700">{order.customer_name}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}
                          >
                            {ORDER_STATUSES[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
                          >
                            {PAYMENT_STATUSES[order.payment_status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/orders/${order.id}`}>
                            <Button variant="outline">View</Button>
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
        </>
      )}
    </div>
  )
}

export default AdminOrdersPage
