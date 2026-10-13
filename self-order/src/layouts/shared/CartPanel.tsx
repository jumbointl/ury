import { formatCurrency } from '@ury/core'
import { useState } from 'react'
import { groupOrderItems, type CustomerOrder, type MenuItem, type OrderingContext } from '../../lib/api'
import BillDialog, { type BillData } from './BillDialog'
import { t, tItems } from '../../lib/i18n'

type CartEntry = { item: MenuItem; qty: number }

interface CartPanelProps {
  context: OrderingContext | null
  order: CustomerOrder | null
  cartItems: CartEntry[]
  cartCount: number
  cartTotal: number
  submitting: boolean
  billRequested: boolean
  payingOnline: boolean
  onIncrement: (item: MenuItem) => void
  onDecrement: (itemCode: string) => void
  onSubmit: () => void
  onRequestBill: (data?: BillData) => void
  onPayOnline: () => void
  className?: string
}

/**
 * Persistent order-summary + cart panel shared between TabletLayout and
 * LandscapeKioskLayout. Unlike MobileQRLayout's bottom sheet, this is always
 * visible — no toggle to open/close it.
 */
function CartPanel({
  context,
  order,
  cartItems,
  cartCount,
  cartTotal,
  submitting,
  billRequested,
  payingOnline,
  onIncrement,
  onDecrement,
  onSubmit,
  onRequestBill,
  onPayOnline,
  className,
}: CartPanelProps) {
  const [billOpen, setBillOpen] = useState(false)
  return (
    <aside className={className}>
      <div className="flex-1 overflow-y-auto">
        {order && order.items.length > 0 && (
          <section className="mb-4 rounded-lg border p-3">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t('your_order')}</h2>
            <ul className="space-y-1 text-sm">
              {groupOrderItems(order.items).map((row, idx) => (
                <li key={`${row.item_code}-${idx}`} className="flex justify-between">
                  <span>
                    {row.item_name} × {row.qty}
                  </span>
                  <span className="tabular-nums">{formatCurrency(row.amount)}</span>
                </li>
              ))}
            </ul>
            {order.customer && <p className="mt-1 text-xs text-muted-foreground">{t('invoice_to', { name: order.customer })}</p>}
            <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
              <span>{t('total')}</span>
              <span className="tabular-nums">{formatCurrency(order.grand_total)}</span>
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t('cart')}</h2>
          {cartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('tap_to_add')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {cartItems.map((entry) => (
                <li key={entry.item.item} className="flex items-center justify-between gap-2">
                  <span className="flex-1">{entry.item.item_name}</span>
                  <span className="flex items-center gap-2">
                    <button
                      onClick={() => onDecrement(entry.item.item)}
                      className="h-7 w-7 rounded-full border text-sm leading-none"
                      aria-label={t('remove_one', { item: entry.item.item_name })}
                    >
                      −
                    </button>
                    <span className="w-4 text-center">{entry.qty}</span>
                    <button
                      onClick={() => onIncrement(entry.item)}
                      className="h-7 w-7 rounded-full border text-sm leading-none"
                      aria-label={t('add_one', { item: entry.item.item_name })}
                    >
                      +
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="border-t pt-3">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>
            {tItems(cartCount)}
          </span>
          <span className="tabular-nums">{formatCurrency(cartTotal)}</span>
        </div>
        <button
          onClick={onSubmit}
          disabled={submitting || cartCount === 0}
          className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? t('placing') : t('place_order')}
        </button>
        {context?.capabilities.customer_payment_enabled && order && !order.billed && (
          <button
            className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={payingOnline}
            onClick={onPayOnline}
          >
            {payingOnline ? t('starting_payment') : t('pay_online')}
          </button>
        )}
        {context?.capabilities.request_bill_enabled && order && !order.billed && (
          <button
            className="mt-2 w-full rounded-md border py-2 text-sm font-medium disabled:opacity-50"
            disabled={billRequested}
            onClick={() => setBillOpen(true)}
          >
            {billRequested ? t('bill_requested') : t('request_bill')}
          </button>
        )}
      </div>
      <BillDialog
        open={billOpen}
        submitting={submitting}
        onClose={() => setBillOpen(false)}
        onConfirm={(data) => {
          setBillOpen(false)
          onRequestBill(data)
        }}
      />
    </aside>
  )
}

export default CartPanel
