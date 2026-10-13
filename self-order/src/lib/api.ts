import { call, storage } from '@ury/core'
import { setSiteLanguage } from './i18n'

const M = 'ury.ury.api.self_ordering'

export interface OrderingCapabilities {
  product_detail_enabled: boolean
  show_item_images: boolean
  show_item_descriptions: boolean
  item_notes_enabled: boolean
  request_bill_enabled: boolean
  customer_payment_enabled: boolean
  payment_link_enabled: boolean
  pay_at_counter_enabled: boolean
  add_to_running_table_enabled: boolean
}

export type OrderingLayout = 'Mobile' | 'Tablet' | 'Landscape Kiosk' | 'Portrait Kiosk'

export interface OrderingContext {
  session: string
  source: string
  restaurant: string
  table: string | null
  layout: OrderingLayout
  capabilities: OrderingCapabilities
  // Moneda de la empresa (símbolo/decimales/formato) e idioma del sitio: el cliente no inicia sesión,
  // así que no tiene los valores que el POS guarda en localStorage.
  currency?: { code: string; symbol: string; number_format: string | null; precision: number }
  language?: string | null
}

export interface MenuItem {
  item: string
  item_name: string
  rate: number
  special_dish: number
  disabled: number
  item_image: string | null
  course: string | null
  course_label: string | null
}

export interface MenuResponse {
  items: MenuItem[]
  modified_time: string | null
  name: string | null
}

export interface OrderItem {
  item_code: string
  item_name: string
  qty: number
  comment: string | null
  rate: number
  amount: number
}

export interface CustomerOrder {
  invoice: string | null
  table?: string | null
  order_type?: string
  // Pickup reference code (derived from the invoice name) — the only
  // identifier a QR Pickup customer has, since there's no table to point
  // to. Present (possibly null before an order exists) on every response.
  pickup_code?: string | null
  items: OrderItem[]
  grand_total: number
  billed: boolean
  // Cliente de la factura cuando el comensal cargó RUC/cédula al pedir la cuenta (null = consumidor final).
  customer?: string | null
}

/** Líneas del pedido agrupadas por plato y comentario (cada ronda agrega filas nuevas en la factura). */
export function groupOrderItems(items: OrderItem[]): OrderItem[] {
  const grouped = new Map<string, OrderItem>()
  for (const row of items) {
    const key = `${row.item_code}|${row.comment ?? ''}`
    const existing = grouped.get(key)
    if (existing) {
      existing.qty += row.qty
      existing.amount += row.amount
    } else {
      grouped.set(key, { ...row })
    }
  }
  return Array.from(grouped.values())
}

export interface OrderStatus {
  session_status: string
  invoice: string | null
  billed?: boolean
  submitted?: boolean
  open_requests?: { name: string; request_type: string; status: string }[]
}

// Persist the full ordering context (not just the opaque session token)
// across the browser session — a page refresh/resume must not force a
// customer to rescan, and must not lose capabilities/table/layout either
// (a session-token-only resume can't reconstruct those without another
// round trip the backend doesn't offer for an already-open session).
const SESSION_KEY = 'ury_order_session'
const CONTEXT_KEY = 'ury_order_context'

export function getStoredSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY)
}

export function getStoredContext(): OrderingContext | null {
  const raw = sessionStorage.getItem(CONTEXT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OrderingContext
  } catch {
    return null
  }
}

function storeContext(context: OrderingContext) {
  sessionStorage.setItem(SESSION_KEY, context.session)
  sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context))
  applyContextLocale(context)
}

/** formatCurrency() de @ury/core lee estas claves de localStorage (las mismas que escribe el POS). */
export function applyContextLocale(context: OrderingContext) {
  try {
    if (context.currency) {
      storage.setItem('currencySymbol', context.currency.symbol || context.currency.code)
      storage.setItem('currencyCode', context.currency.code)
      storage.setItem('numberFormat', context.currency.number_format || '')
      storage.setItem('currencyPrecision', String(context.currency.precision ?? 2))
    }
  } catch {
    /* sin localStorage (modo privado): se muestra con el símbolo por defecto */
  }
  setSiteLanguage(context.language)
}

// Every whitelisted Frappe method response is wrapped as {"message": <actual
// return value>} — call.get/call.post return that whole envelope as-is
// (frappe-js-sdk does not unwrap it; see pos/src/lib/menu-api.ts's
// GetMenuResponse for the same established pattern in this codebase). Every
// function below must unwrap `.message` itself. Missing this doesn't throw —
// it silently produces `undefined` fields (e.g. `context.session` would be
// undefined instead of a string), which cascades into every subsequent call
// silently sending no value for that parameter at all. Confirmed live via
// browser network capture: get_customer_menu was called with an entirely
// empty query string because the "session" it was given was undefined.
interface FrappeResponse<T> {
  message: T
}

export async function bootstrap(token: string): Promise<OrderingContext> {
  const response = await call.get<FrappeResponse<OrderingContext>>(`${M}.get_ordering_context`, { token })
  storeContext(response.message)
  return response.message
}

export async function bootstrapDevice(deviceId: string, deviceCredential: string): Promise<OrderingContext> {
  const response = await call.get<FrappeResponse<OrderingContext>>(`${M}.get_ordering_context`, {
    device_id: deviceId,
    device_credential: deviceCredential,
  })
  storeContext(response.message)
  return response.message
}

export async function assignDeviceTable(
  deviceId: string,
  deviceCredential: string,
  staffPin: string,
  table: string,
): Promise<OrderingContext> {
  const response = await call.post<FrappeResponse<OrderingContext>>(`${M}.assign_device_table`, {
    device_id: deviceId,
    device_credential: deviceCredential,
    staff_pin: staffPin,
    table,
  })
  storeContext(response.message)
  return response.message
}

export async function getMenu(session: string): Promise<MenuResponse> {
  const response = await call.get<FrappeResponse<MenuResponse>>(`${M}.get_customer_menu`, { session })
  return response.message
}

export async function getCurrentOrder(session: string): Promise<CustomerOrder> {
  const response = await call.get<FrappeResponse<CustomerOrder>>(`${M}.get_customer_order`, { session })
  return response.message
}

export async function addItems(
  session: string,
  items: { item: string; qty: number; comment?: string }[],
): Promise<CustomerOrder> {
  const response = await call.post<FrappeResponse<CustomerOrder>>(`${M}.add_customer_items`, {
    session,
    items: JSON.stringify(items),
  })
  return response.message
}

export interface BillRequestResult {
  status: string
  request: string
  customer?: string | null
}

export async function requestBill(session: string, documento?: string, nombre?: string): Promise<BillRequestResult> {
  const response = await call.post<FrappeResponse<BillRequestResult>>(`${M}.request_bill`, {
    session,
    documento: documento || '',
    nombre: nombre || '',
  })
  return response.message
}

export async function getStatus(session: string): Promise<OrderStatus> {
  const response = await call.get<FrappeResponse<OrderStatus>>(`${M}.get_order_status`, { session })
  return response.message
}

export interface PaymentRequestResult {
  payment_request: string
  amount: number
  currency: string
  payment_url: string | null
  status: string
}

export interface PaymentStatusResult {
  status: string | null
  payment_request?: string
  amount?: number
}

export async function createPaymentRequest(session: string): Promise<PaymentRequestResult> {
  const response = await call.post<FrappeResponse<PaymentRequestResult>>(`${M}.create_payment_request`, { session })
  return response.message
}

export async function getPaymentStatus(session: string): Promise<PaymentStatusResult> {
  const response = await call.get<FrappeResponse<PaymentStatusResult>>(`${M}.get_payment_status`, { session })
  return response.message
}

export async function sharePaymentLink(
  session: string,
  recipient: string,
): Promise<{ status: string; payment_request: string }> {
  const response = await call.post<FrappeResponse<{ status: string; payment_request: string }>>(
    `${M}.share_payment_link`,
    { session, recipient },
  )
  return response.message
}
