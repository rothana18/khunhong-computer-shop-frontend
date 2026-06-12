import React, { useEffect, useState } from 'react'
import { FiMinus, FiPackage, FiPlus, FiTrash2 } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { ordersApi } from '@/api/orders'
import { cartApi } from '@/api/cart'
import { addressesApi } from '@/api/addresses'
import { productsApi } from '@/api/products'
import Loading from '@/components/common/Loading'
import Alert from '@/components/common/Alert'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import AppImage from '@/components/common/AppImage'
import { formatCurrency, imageUrl } from '@/utils/formatters'
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/utils/constants'
import { apiMessage } from '@/utils/axiosError'
import type { Address, PaymentMethod, Product, ShippingMethod } from '@/types'
import { useCart } from '@/hooks/useCart'
import { usePageTitle } from '@/hooks/usePageTitle'

const NewOrderPage: React.FC = () => {
  usePageTitle('Cart')
  const navigate = useNavigate()
  const { items, updateQuantity, clearCart } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [products, setProducts] = useState<Map<number, Product>>(new Map())
  const [addressId, setAddressId] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard_delivery')
  const [orderNotes, setOrderNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staleMissing, setStaleMissing] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      setLoading(false)
      return
    }

    // Fetch addresses and current product data in parallel.
    // Products are fetched individually so we always get live prices and stock.
    // Items whose products are no longer available are silently dropped.
    Promise.all([
      addressesApi.list(),
      Promise.all(
        items.map(
          (item) =>
            productsApi
              .getById(item.productId)
              .then((res) => res.data.data)
              .catch(() => null) // product deleted / unavailable
        )
      ),
    ])
      .then(([addrRes, productResults]) => {
        const addrs = addrRes.data.data
        setAddresses(addrs)
        const def = addrs.find((a) => a.is_default) ?? addrs[0]
        if (def) setAddressId(def.id)

        const map = new Map<number, Product>()
        let anyMissing = false
        productResults.forEach((product, idx) => {
          if (product) {
            map.set(items[idx].productId, product)
          } else {
            anyMissing = true
          }
        })
        setProducts(map)
        if (anyMissing) setStaleMissing(true)
      })
      .catch((err) => setError(apiMessage(err, 'Failed to load cart data')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  // Only include items whose product data loaded successfully
  const resolvedItems = items.filter((i) => products.has(i.productId))

  const total = resolvedItems.reduce((sum, i) => {
    const p = products.get(i.productId)!
    return sum + Number(p.discount_price ?? p.price) * i.quantity
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressId || resolvedItems.length === 0) {
      setError('Please add at least one product and select an address')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await cartApi.sync(
        resolvedItems.map((i) => ({ product_id: i.productId, quantity: i.quantity }))
      )
      const res = await ordersApi.checkout({
        address_id: addressId as number,
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        order_notes: orderNotes || undefined,
      })
      clearCart()
      navigate(`/orders/${res.data.data.id}`, { state: { justPlaced: true } })
    } catch (err) {
      setError(apiMessage(err, 'Failed to place order'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading className="py-20" />

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Your Cart</h1>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {staleMissing && (
        <Alert
          type="warning"
          message="Some items in your cart are no longer available and have been removed."
          onClose={() => setStaleMissing(false)}
        />
      )}

      {resolvedItems.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500">Your cart is empty.</p>
          <Link
            to="/products"
            className="mt-4 inline-block text-sm text-primary-600 hover:underline"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <form
            id="order-form"
            onSubmit={handleSubmit}
            className="mt-4 grid grid-cols-1 gap-6 pb-24 lg:grid-cols-3 lg:pb-0"
          >
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Cart</h3>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm text-red-500 hover:text-red-700 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-3">
                  {resolvedItems.map((item) => {
                    const product = products.get(item.productId)!
                    return (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                          <AppImage
                            src={imageUrl(product.image_url)}
                            alt=""
                            className="h-full w-full object-cover"
                            fallback={
                              <div className="flex h-full items-center justify-center">
                                <FiPackage className="h-5 w-5 text-gray-300" />
                              </div>
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(product.discount_price ?? product.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="flex h-11 w-11 items-center justify-center rounded border hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <FiMinus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= product.stock_quantity}
                            className="flex h-11 w-11 items-center justify-center rounded border hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <FiPlus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="w-20 text-right text-sm font-medium">
                          {formatCurrency(
                            Number(product.discount_price ?? product.price) * item.quantity
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 0)}
                          className="flex h-11 w-11 items-center justify-center text-gray-400 transition-colors hover:text-red-500"
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card title="Shipping & Payment">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="delivery-address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Delivery Address
                    </label>
                    {addresses.length === 0 ? (
                      <p className="mt-1 text-sm text-gray-500">
                        No saved addresses.{' '}
                        <Link
                          to="/addresses"
                          state={{ from: '/cart' }}
                          className="text-primary-600 hover:underline"
                        >
                          Add one
                        </Link>
                      </p>
                    ) : (
                      <select
                        id="delivery-address"
                        value={addressId}
                        onChange={(e) => setAddressId(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      >
                        <option value="">Select address</option>
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.full_name} — {a.street_house}, {a.district_khan}
                            {a.is_default ? ' (default)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="payment-method"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Payment Method
                    </label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      {Object.entries(PAYMENT_METHODS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="shipping-method"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Shipping Method
                    </label>
                    <select
                      id="shipping-method"
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value as ShippingMethod)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      {Object.entries(SHIPPING_METHODS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="order-notes"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Order Notes (optional)
                    </label>
                    <textarea
                      id="order-notes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Summary">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Items</dt>
                    <dd>{resolvedItems.reduce((s, i) => s + i.quantity, 0)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <dt className="font-semibold text-gray-900">Total</dt>
                    <dd className="font-bold text-primary-700">{formatCurrency(total)}</dd>
                  </div>
                </dl>
              </Card>
              <div className="hidden lg:block">
                <Button
                  type="submit"
                  fullWidth
                  isLoading={submitting}
                  loadingLabel="Placing order..."
                >
                  Place Order
                </Button>
              </div>
            </div>
          </form>

          {/* Mobile sticky checkout bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-primary-700">{formatCurrency(total)}</p>
            </div>
            <Button
              type="submit"
              form="order-form"
              isLoading={submitting}
              loadingLabel="Placing order..."
            >
              Place Order
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default NewOrderPage
