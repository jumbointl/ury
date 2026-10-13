import React, { useState, useEffect } from 'react';
import { X, Percent, Coins } from 'lucide-react';
import { usePOSStore } from '../store/pos-store';
import { formatCurrency, formatMoney, localeFor, call, parseFrappeError } from '@ury/core';
import { Button, Input, Dialog, DialogContent, showToast } from '@ury/ui';
import { DEFAULT_PAYMENT_MODE } from '../data/order-types';
import { t } from '../i18n';

/**
 * Multimoneda (app `multimoneda` de Frappe): el cajero puede recibir cada medio de pago en otra moneda.
 * El monto que viaja a ERPNext (`amount`) sigue en la moneda de la factura; la moneda, el monto recibido y
 * la cotización van en campos propios de la línea de pago. Sin la app instalada, el diálogo se comporta
 * como el original (una sola moneda).
 */
interface MonedaCobro {
  codigo: string;
  simbolo: string;
  tasa: number;        // unidades de la moneda principal por 1 de esta
  decimales: number;
  formato?: string;    // number_format de Frappe
}
interface MonedasResponse {
  principal: { codigo: string; simbolo: string; decimales: number; formato?: string };
  monedas: MonedaCobro[];
  /** Moneda en la que se da el vuelto si el cajero no elige otra (configuración de multimoneda). */
  vuelto?: string;
}
interface PaymentInput { currency: string; amount: string }

interface PaymentDialogProps {
  onClose: () => void;
  grandTotal: number;
  roundedTotal: number;
  invoice: string;
  customer: string;
  posProfile: string;
  table: string | null;
  tableLabel?: string | null;
  cashier: string;
  owner: string;
  fetchOrders: () => Promise<void>;
  clearSelectedOrder: () => void;
  discountPercentage?: number;
  discountAmount?: number;
}

const roundTo = (n: number, decimals: number) => {
  const m = Math.pow(10, decimals);
  return Math.round(n * m) / m;
};

async function loadMonedas(): Promise<MonedasResponse | null> {
  const cached = sessionStorage.getItem('monedas_cobro');
  if (cached) {
    try { return JSON.parse(cached); } catch { /* ignore */ }
  }
  try {
    const r: any = await call.get('multimoneda.api.monedas');
    const data: MonedasResponse = r?.message ?? r;
    if (data && data.principal) {
      sessionStorage.setItem('monedas_cobro', JSON.stringify(data));
      return data;
    }
  } catch (e) {
    // App multimoneda no instalada o sin permiso: una sola moneda.
    console.warn('multimoneda no disponible:', e);
  }
  return null;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  onClose,
  grandTotal,
  roundedTotal,
  invoice,
  customer,
  posProfile,
  table,
  tableLabel,
  cashier,
  owner,
  fetchOrders,
  clearSelectedOrder,
  discountPercentage,
  discountAmount
}) => {
  const { paymentModes, fetchPaymentModes, posProfile: storePosProfile } = usePOSStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monedas, setMonedas] = useState<MonedasResponse | null>(null);
  // Cobro parcial: pagos ya cargados en la cuenta abierta (app multimoneda, `pagos_de`)
  const [prepaid, setPrepaid] = useState<any[]>([]);
  const [isPartial, setIsPartial] = useState(false);
  // Moneda en la que se devuelve el vuelto (el cierre de caja la descuenta de esa moneda)
  const [changeCurrency, setChangeCurrency] = useState<string>('');

  // Calculate effective percentage if only amount is provided (for invoice-level discounts)
  const effectivePercentage = discountPercentage 
    ? discountPercentage 
    : (discountAmount && grandTotal + discountAmount > 0 
        ? (discountAmount / (grandTotal + discountAmount)) * 100 
        : 0);
        
  const [discountValue, setDiscountValue] = useState<string>(effectivePercentage > 0 ? String(effectivePercentage) : '');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(discountAmount || 0); // Only tracking transaction discount!
  const [paymentInputs, setPaymentInputs] = useState<{ [mode: string]: PaymentInput }>({});

  useEffect(() => {
    fetchPaymentModes();
    loadMonedas().then((m) => {
      setMonedas(m);
      if (m) setChangeCurrency(m.vuelto || m.principal.codigo);
    });
    (async () => {
      try {
        const r: any = await call.get('multimoneda.api.pagos_de', { invoice });
        const data = r?.message ?? r;
        if (data && Array.isArray(data.pagos)) setPrepaid(data.pagos);
      } catch (e) {
        // sin la app multimoneda no hay cobro parcial
      }
    })();
  }, [fetchPaymentModes, invoice]);

  const principal = monedas?.principal ?? null;
  const principalCode = principal?.codigo ?? '';
  const principalDecimals = principal?.decimales ?? 2;
  const extras: MonedaCobro[] = monedas?.monedas ?? [];
  const multimoneda = extras.length > 0;

  const monedaDe = (code: string): MonedaCobro | null => extras.find((m) => m.codigo === code) ?? null;
  const fmt = (amount: number, code?: string) => {
    if (!code || code === principalCode) return formatCurrency(amount);
    const m = monedaDe(code);
    if (!m) return formatCurrency(amount);
    return formatMoney(amount, m.simbolo, m.decimales, localeFor(m.formato));
  };
  // Monto en moneda principal de un pago cargado en `code`.
  const aPrincipal = (amount: number, code?: string) => {
    if (!code || code === principalCode) return amount;
    const m = monedaDe(code);
    return m ? roundTo(amount * m.tasa, principalDecimals) : amount;
  };
  const dePrincipal = (amount: number, code?: string) => {
    if (!code || code === principalCode) return amount;
    const m = monedaDe(code);
    return m && m.tasa > 0 ? roundTo(amount / m.tasa, m.decimales) : amount;
  };

  // baseTotal represents the amount before any invoice-level discount (like pricing rule or manual discount)
  const baseTotal = grandTotal + (discountAmount || 0);

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setError(t('errors.invalid_discount'));
      return;
    }
    if (value > 100) {
      setError(t('errors.discount_exceeds_max'));
      return;
    }
    const calculatedDiscount = (baseTotal * value) / 100;
    setAppliedDiscount(calculatedDiscount);
    setError(null);
  };

  // Order summary logic
  const subtotal = baseTotal;
  const totalDiscount = appliedDiscount;
  const discountedTotal = Math.max(0, subtotal - totalDiscount);
  // If discount is applied, round up; else, round normally (ERPNext rounds the invoice to the currency's precision)
  const finalTotal = appliedDiscount > 0
    ? (principalDecimals === 0 ? Math.ceil(discountedTotal) : roundTo(discountedTotal, principalDecimals))
    : (principalDecimals === 0 ? Math.round(discountedTotal) : roundTo(roundedTotal, principalDecimals));

  const inputOf = (id: string): PaymentInput => paymentInputs[id] ?? { currency: principalCode, amount: '' };

  // Calculate split payment total (in the invoice currency)
  const payments = paymentModes
    .map((mode: any) => {
      const id = typeof mode === 'string' ? mode : mode.id;
      const input = inputOf(id);
      const typed = parseFloat(input.amount || '');
      if (!(typed > 0)) return null;
      const currency = input.currency || principalCode;
      const amount = aPrincipal(typed, currency);
      if (multimoneda && currency && currency !== principalCode) {
        const m = monedaDe(currency);
        return { mode_of_payment: id, amount, moneda_cobro: currency, cotizacion_cobro: m?.tasa, monto_moneda: typed };
      }
      return { mode_of_payment: id, amount };
    })
    .filter(Boolean);
  const prepaidTotal = roundTo(prepaid.reduce((sum, p: any) => sum + (p.amount || 0), 0), principalDecimals);
  const newPaymentsTotal = roundTo(payments.reduce((sum, p: any) => sum + p.amount, 0), principalDecimals);
  const paymentsTotal = roundTo(prepaidTotal + newPaymentsTotal, principalDecimals);
  const shortfall = roundTo(finalTotal - paymentsTotal, principalDecimals);
  const isShort = shortfall > 0.005;
  const changeDue = roundTo(paymentsTotal - finalTotal, principalDecimals);

  const finalAdjustment = finalTotal - discountedTotal;
  const roundedFinalAdjustment = Math.round(finalAdjustment * 100) / 100;
  const showFinalAdjustment = Math.abs(roundedFinalAdjustment) > 0.001;

  useEffect(()=>{
    const defaultPaymentModePresent=paymentModes.find((mode)=>mode===DEFAULT_PAYMENT_MODE)
    //only one payment mode should be present, then autofill the final amount, if not do not fill
    const otherPaymentModesNotEntered=Object.keys(paymentInputs).length<=1;
    if(finalTotal && paymentModes && DEFAULT_PAYMENT_MODE && defaultPaymentModePresent && otherPaymentModesNotEntered){
      //check if default payment mode is present in paymentModes
      setPaymentInputs((prev)=>({ 
        ...prev,
        [DEFAULT_PAYMENT_MODE]: { currency: principalCode, amount: String(roundTo(Math.max(0, finalTotal - prepaidTotal), principalDecimals)) }
      }))
    }
  },[finalTotal,paymentModes,principalCode])

  // Helper to calculate remaining balance (invoice currency)
  const getRemainingBalance = (currentId: string) => {
    const totalEntered = Object.entries(paymentInputs)
      .filter(([id]) => id !== currentId)
      .reduce((sum, [_, val]) => sum + aPrincipal(parseFloat(val.amount) || 0, val.currency), 0);
    return Math.max(0, roundTo(finalTotal - prepaidTotal - totalEntered, principalDecimals));
  };

  // Handler for input focus to auto-fill remaining balance (converted to the row's currency)
  const handlePaymentInputFocus = (id: string) => {
    setPaymentInputs(inputs => {
      const current = inputs[id] ?? { currency: principalCode, amount: '' };
      if (!current.amount || parseFloat(current.amount) === 0) {
        const remaining = dePrincipal(getRemainingBalance(id), current.currency);
        return { ...inputs, [id]: { ...current, amount: remaining > 0 ? String(remaining) : '' } };
      }
      return inputs;
    });
  };

  const setAmount = (id: string, amount: string) =>
    setPaymentInputs(inputs => ({ ...inputs, [id]: { ...(inputs[id] ?? { currency: principalCode, amount: '' }), amount } }));
  const setCurrency = (id: string, currency: string) =>
    setPaymentInputs(inputs => {
      const current = inputs[id] ?? { currency: principalCode, amount: '' };
      // Convertir lo ya tipeado a la moneda nueva, para no perder el monto
      const typed = parseFloat(current.amount || '');
      const amount = typed > 0 ? String(dePrincipal(aPrincipal(typed, current.currency), currency)) : current.amount;
      return { ...inputs, [id]: { currency, amount } };
    });

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      if (multimoneda && changeDue > 0.005) {
        // make_invoice de URY no recibe campos extra: la moneda del vuelto se fija en la cuenta antes de cerrarla.
        try {
          await call.post('multimoneda.api.fijar_vuelto', { invoice, moneda: changeCurrency || principalCode });
        } catch (e) {
          console.warn('No se pudo fijar la moneda del vuelto:', e);
        }
      }
      await call.post('ury.ury.doctype.ury_order.ury_order.make_invoice', {
        additionalDiscount: appliedDiscount > 0 ? appliedDiscount : null,
        cashier,
        customer,
        invoice,
        owner,
        payments: [...prepaid, ...payments],
        pos_profile: posProfile,
        table,
      });
      showToast.success(t('payment.success', { amount: formatCurrency(paymentsTotal) }));
      onClose();
      clearSelectedOrder();
      await fetchOrders();
    } catch (err) {
      console.error('Payment failed:', err);
      // parseFrappeError extracts human-readable message from _server_messages (e.g. stock validation error)
      setError(parseFrappeError(err, t('errors.payment_failed')));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePartialPayment = async () => {
    setIsPartial(true);
    setError(null);
    try {
      const r: any = await call.post('multimoneda.api.pago_parcial', { invoice, payments });
      const data = r?.message ?? r;
      showToast.success(t('payment.partial_success', { paid: formatCurrency(data?.pagado ?? paymentsTotal), remaining: formatCurrency(data?.falta ?? shortfall) }));
      onClose();
      await fetchOrders();
    } catch (err) {
      console.error('Partial payment failed:', err);
      setError(parseFrappeError(err, t('errors.payment_failed')));
    } finally {
      setIsPartial(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent variant="xlarge" className="bg-white w-full max-w-4xl max-h-dialog-max-h flex flex-col md:flex-row p-0" showCloseButton={false}>
        {/* Left Column - Discount and Payment Mode */}
        <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('payment.title')}</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Discount Section (conditional) */}
          {storePosProfile?.enable_discount === 1 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Percent className="w-5 h-5" />
                {t('payment.apply_discount')}
              </h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={t('payment.discount_placeholder')}
                  size="sm"
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyDiscount}
                  variant="default"
                  size="sm"
                >
                  {t('common.apply')}
                </Button>
              </div>
            </div>
          )}

          {/* Equivalents of the total in every accepted currency */}
          {multimoneda && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium mb-1">{t('payment.equivalents')}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {extras.map((m) => (
                  <span key={m.codigo} className="whitespace-nowrap">
                    <span className="text-gray-500">{m.codigo}</span>{' '}
                    <span className="font-semibold">{fmt(dePrincipal(finalTotal, m.codigo), m.codigo)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Payment Methods Section - Split Payment */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">{t('payment.payment_methods')}</h3>
            {prepaid.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <div className="font-medium text-green-800">{t('payment.paid_before', { amount: formatCurrency(prepaidTotal) })}</div>
                <ul className="mt-1 text-green-700">
                  {prepaid.map((p: any, i: number) => (
                    <li key={i}>
                      {p.mode_of_payment}: {p.moneda_cobro && p.moneda_cobro !== principalCode ? `${fmt(p.monto_moneda, p.moneda_cobro)} = ` : ''}{formatCurrency(p.amount)}
                    </li>
                  ))}
                </ul>
                <div className="mt-1 font-medium text-green-800">{t('payment.remaining', { amount: formatCurrency(Math.max(0, finalTotal - prepaidTotal)) })}</div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {paymentModes.map((mode: any) => {
                const id = typeof mode === 'string' ? mode : mode.id;
                const input = inputOf(id);
                const typed = parseFloat(input.amount || '');
                const foreign = multimoneda && input.currency && input.currency !== principalCode;
                return (
                  <div key={id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="w-24 font-medium">{typeof mode === 'string' ? mode : mode.name}</span>
                      {multimoneda && (
                        <select
                          value={input.currency || principalCode}
                          onChange={(e) => setCurrency(id, e.target.value)}
                          disabled={isProcessing}
                          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm"
                          aria-label={t('payment.currency')}
                        >
                          <option value={principalCode}>{principal?.simbolo} {principalCode}</option>
                          {extras.map((m) => (
                            <option key={m.codigo} value={m.codigo}>{m.simbolo} {m.codigo}</option>
                          ))}
                        </select>
                      )}
                      <Input
                        type="number"
                        min="0"
                        step={foreign && monedaDe(input.currency)?.decimales === 0 ? '1' : '0.01'}
                        value={input.amount}
                        onChange={e => setAmount(id, e.target.value)}
                        onFocus={() => handlePaymentInputFocus(id)}
                        placeholder={t('payment.amount_placeholder')}
                        className="flex-1"
                        size="sm"
                        disabled={isProcessing}
                      />
                    </div>
                    {foreign && typed > 0 && (
                      <div className="pl-24 text-xs text-gray-500">
                        {fmt(typed, input.currency)} = {formatCurrency(aPrincipal(typed, input.currency))}
                        {' '}({t('payment.rate')} 1 {principalCode} = {fmt(dePrincipal(1, input.currency), input.currency)})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="font-medium">{t('payment.total_entered')}</span>
              <span className={`${isShort ? 'text-amber-700' : 'text-green-600'} font-semibold flex items-center gap-1`}>
                {formatCurrency(paymentsTotal)} / {formatCurrency(finalTotal)}
                {changeDue > 0.005 && (
                  <span className="text-yellow-700 font-semibold">
                    <Coins className="inline w-4 h-4 ml-1 text-yellow-500" />
                    <span className="text-yellow-500 font-bold ml-1">{formatCurrency(changeDue)}</span>
                  </span>
                )}
              </span>
            </div>
            {isShort && (
              <p role="status" className="text-amber-700 text-sm font-medium">
                {t('payment.short_by', { amount: formatCurrency(shortfall) })}
              </p>
            )}
            {changeDue > 0.005 && (
              <div className="text-yellow-700 text-sm font-medium">
                {t('payment.change_due', { amount: formatCurrency(changeDue) })}
                {multimoneda && (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="text-xs text-gray-500 font-normal mr-1">{t('payment.change_in')}</span>
                    {[{ codigo: principalCode }, ...extras].map((m) => {
                      const selected = (changeCurrency || principalCode) === m.codigo;
                      return (
                        <button
                          key={m.codigo}
                          type="button"
                          onClick={() => setChangeCurrency(m.codigo)}
                          className={`px-2 py-1 rounded border text-xs font-semibold ${selected ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        >
                          {m.codigo} {fmt(dePrincipal(changeDue, m.codigo), m.codigo)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Order Summary and Pay Button */}
        <div className="md:w-1/2 p-6 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold">{t('payment.order_summary')}</h3>
            {tableLabel && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('tables.table_name')}</span>
                <span className="font-medium">{tableLabel}</span>
              </div>
            )}
            <div className="space-y-2 text-sm">
              {/* Subtotal (Grand Total) */}
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment.subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {/* Discount */}
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('payment.discount')}</span>
                  <span>-{formatCurrency(appliedDiscount)}</span>
                </div>
              )}
              {/* Adjustment (if any) */}
              {showFinalAdjustment && (
                <div className="flex justify-between text-blue-600">
                  <span>{t('payment.adjustment')}</span>
                  <span>{roundedFinalAdjustment > 0 ? '+' : ''}{formatCurrency(roundedFinalAdjustment)}</span>
                </div>
              )}
              {/* Final Total (Rounded) */}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('payment.total')}</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing || isPartial || paymentsTotal <= 0 || isShort}
            variant={isProcessing || isPartial || paymentsTotal <= 0 || isShort ? "secondary" : "default"}
            className="w-full"
          >
            {isProcessing ? t('payment.processing') : t('payment.pay_button', { amount: formatCurrency(paymentsTotal > 0 ? paymentsTotal : finalTotal) })}
          </Button>
          {/* Partial payment: keeps the order open with what was paid so far (multimoneda app) */}
          {multimoneda && isShort && payments.length > 0 && (
            <Button
              onClick={handlePartialPayment}
              disabled={isProcessing || isPartial}
              variant="outline"
              className="w-full mt-2"
            >
              {isPartial ? t('payment.processing') : t('payment.partial_button', { amount: formatCurrency(newPaymentsTotal), remaining: formatCurrency(shortfall) })}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
