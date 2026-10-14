import { useEffect, useState } from 'react';
import { call, formatCurrency, parseFrappeError } from '@ury/core';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, showToast } from '@ury/ui';
import { CustomerPicker } from './CustomerPicker';
import type { Customer } from '../store/pos-store';
import { t } from '../i18n';

/**
 * Acciones sobre una orden cerrada (app `caja_pos` de Frappe): corregir el cliente (enmienda con el mismo
 * número o nominación en SIFEN) y devolución (nota de crédito) con destino por línea: repone stock o pérdida.
 */
export function isClosedOrder(status: string) {
  return status === 'Paid' || status === 'Recently Paid' || status === 'Consolidated';
}

const unwrap = (r: any) => r?.message ?? r;

interface EstadoFactura {
  name: string;
  customer: string;
  customer_name?: string;
  sifen_estado?: string;
  sifen_numero?: string;
  sifen_cdc?: string;
  sifen_mensaje?: string;
  innominada: boolean;
  accion_cliente: 'enmendar' | 'nominar' | 'ninguna';
  por_que: string;
  puede_devolver: boolean;
  devoluciones: string[];
}

export function useEstadoFactura(invoice: string | null, open: boolean) {
  const [estado, setEstado] = useState<EstadoFactura | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!invoice || !open) return;
    setLoading(true);
    call.get('caja_pos.api.estado_factura', { invoice })
      .then((r: any) => setEstado(unwrap(r)))
      .catch((e: any) => { console.error(e); setEstado(null); })
      .finally(() => setLoading(false));
  }, [invoice, open]);
  return { estado, loading };
}

/* ---------------------------------------------------------------- Corregir cliente / Nominar */
interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: string;
  onDone: () => Promise<void> | void;
}

export function ClienteDialog({ open, onOpenChange, invoice, onDone }: ClienteDialogProps) {
  const { estado, loading } = useEstadoFactura(invoice, open);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setCustomer(null); setMotivo(''); setError(null); } }, [open]);

  const confirmar = async () => {
    if (!customer) return;
    setBusy(true); setError(null);
    try {
      const r = unwrap(await call.post('caja_pos.api.corregir_cliente', { invoice, customer: customer.id, motivo }));
      showToast.success(r?.accion === 'nominar'
        ? t('closed.nominated', { customer: customer.name || customer.id })
        : t('closed.amended', { invoice: r?.factura || '', numero: r?.sifen_numero || '' }));
      onOpenChange(false);
      await onDone();
    } catch (e) {
      setError(parseFrappeError(e, t('errors.payment_failed')));
    } finally {
      setBusy(false);
    }
  };

  const titulo = estado?.accion_cliente === 'nominar' ? t('closed.nominate') : t('closed.fix_customer');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {loading ? t('common.loading') : estado ? (
              <span>
                {estado.sifen_numero ? `${estado.sifen_numero} · ` : ''}{estado.sifen_estado || t('closed.not_sent')} · {estado.customer_name || estado.customer}
                <br />{estado.por_que}
              </span>
            ) : t('closed.unavailable')}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 mb-3 space-y-3">
          {estado && estado.accion_cliente !== 'ninguna' && (
            <>
              <CustomerPicker value={customer} onChange={setCustomer} disabled={busy} />
              <Input placeholder={t('closed.reason_placeholder')} value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={busy} />
            </>
          )}
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t('common.cancel')}</Button>
          {estado && estado.accion_cliente !== 'ninguna' && (
            <Button onClick={confirmar} disabled={busy || !customer}>{busy ? t('payment.processing') : titulo}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- Devolución */
interface LineaDev {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  disponible: number;
  rate: number;
  destino: 'Repone stock' | 'Pérdida';
  es_stock: number;
}
interface DevolucionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: string;
  onDone: () => Promise<void> | void;
}

export function DevolucionDialog({ open, onOpenChange, invoice, onDone }: DevolucionDialogProps) {
  const [lineas, setLineas] = useState<LineaDev[]>([]);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [destinos, setDestinos] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null); setCantidades({}); setMotivo('');
    call.get('caja_pos.api.lineas_devolucion', { invoice })
      .then((r: any) => {
        const d = unwrap(r);
        setLineas(d?.lineas || []);
        setMotivos(d?.motivos || []);
        const dest: Record<string, string> = {};
        (d?.lineas || []).forEach((l: LineaDev) => { dest[l.name] = l.destino; });
        setDestinos(dest);
      })
      .catch((e: any) => setError(parseFrappeError(e, t('closed.unavailable'))));
  }, [invoice, open]);

  const seleccion = lineas
    .map((l) => ({ name: l.name, qty: parseFloat(cantidades[l.name] || '0') || 0, destino: destinos[l.name] || l.destino, rate: l.rate }))
    .filter((l) => l.qty > 0);
  const total = seleccion.reduce((s, l) => s + l.qty * l.rate, 0);

  const confirmar = async () => {
    if (!seleccion.length) return;
    setBusy(true); setError(null);
    try {
      const r = unwrap(await call.post('caja_pos.api.devolucion', { invoice, lineas: seleccion.map(({ name, qty, destino }) => ({ name, qty, destino })), motivo }));
      showToast.success(t('closed.returned', { invoice: r?.devolucion || '', amount: formatCurrency(r?.total || total), numero: r?.sifen_numero || '' }));
      onOpenChange(false);
      await onDone();
    } catch (e) {
      setError(parseFrappeError(e, t('errors.payment_failed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="xlarge" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('closed.return_title')}</DialogTitle>
          <DialogDescription>{t('closed.return_help')}</DialogDescription>
        </DialogHeader>
        <div className="px-6 mb-3 space-y-3">
          <div className="grid grid-cols-[1fr_80px_90px_140px] gap-2 text-sm font-medium text-gray-600">
            <span>{t('closed.item')}</span><span>{t('closed.available')}</span><span>{t('closed.qty')}</span><span>{t('closed.destination')}</span>
          </div>
          {lineas.map((l) => (
            <div key={l.name} className="grid grid-cols-[1fr_80px_90px_140px] gap-2 items-center text-sm">
              <span>{l.item_name} <span className="text-gray-500">({formatCurrency(l.rate)})</span></span>
              <span>{l.disponible}</span>
              <Input type="number" min="0" max={String(l.disponible)} step="1" size="sm" value={cantidades[l.name] || ''} disabled={busy || l.disponible <= 0}
                onChange={(e) => setCantidades((c) => ({ ...c, [l.name]: e.target.value }))} />
              <select value={destinos[l.name] || l.destino} disabled={busy} onChange={(e) => setDestinos((d) => ({ ...d, [l.name]: e.target.value }))}
                className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm">
                <option value="Repone stock">{t('closed.restock')}</option>
                <option value="Pérdida">{t('closed.loss')}</option>
              </select>
            </div>
          ))}
          <div className="flex gap-2 items-center">
            <select value={motivo} disabled={busy} onChange={(e) => setMotivo(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm flex-1">
              <option value="">{t('closed.reason_placeholder')}</option>
              {motivos.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="font-semibold">{t('closed.refund', { amount: formatCurrency(total) })}</span>
          </div>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={confirmar} disabled={busy || !seleccion.length}>{busy ? t('payment.processing') : t('closed.return_confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ---------------------------------------------------------------- Estado SIFEN / Reenviar */
interface SifenDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: string;
  onDone: () => Promise<void> | void;
}

const REENVIABLES = ['Error', 'Pendiente', 'Rechazado'];

/**
 * Estado de la factura electrónica de la orden cerrada y botón «Reenviar a SIFEN» (sifen_py.api.reenviar)
 * para las que quedaron en Error / Rechazado / Pendiente (modo manual o sin internet).
 */
export function SifenDialog({ open, onOpenChange, invoice, onDone }: SifenDialogProps) {
  const { estado, loading } = useEstadoFactura(invoice, open);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) setError(null); }, [open]);

  const reenviable = !!estado && REENVIABLES.includes(estado.sifen_estado || '');

  const reenviar = async () => {
    setBusy(true); setError(null);
    try {
      await call.post('sifen_py.api.reenviar', { factura: invoice, doctype: 'POS Invoice' });
      showToast.success(t('closed.resent', { invoice }));
      onOpenChange(false);
      await onDone();
    } catch (e: any) {
      setError(parseFrappeError(e, t('closed.unavailable')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>{t('closed.sifen_title')}</DialogTitle>
          <DialogDescription>
            {loading ? t('common.loading') : estado ? (
              <span className="block space-y-1">
                <span className="block"><b>{invoice}</b>{estado.sifen_numero ? ` · ${estado.sifen_numero}` : ''}</span>
                <span className="block">{t('closed.status_label')}: <b>{estado.sifen_estado || t('closed.not_sent')}</b></span>
                {estado.sifen_mensaje && <span className="block text-xs text-gray-500">{estado.sifen_mensaje}</span>}
                {reenviable && <span className="block text-xs text-amber-700">{t('closed.resend_help')}</span>}
              </span>
            ) : t('closed.unavailable')}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="px-6 text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>{t('common.cancel')}</Button>
          {reenviable && (
            <Button onClick={reenviar} disabled={busy}>{busy ? t('payment.processing') : t('closed.resend')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
