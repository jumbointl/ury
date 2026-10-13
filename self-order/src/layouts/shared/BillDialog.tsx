import { useState } from 'react'
import { t } from '../../lib/i18n'

export interface BillData {
  documento?: string
  nombre?: string
}

interface BillDialogProps {
  open: boolean
  submitting: boolean
  onClose: () => void
  onConfirm: (data?: BillData) => void
}

/**
 * Al pedir la cuenta el cliente puede cargar RUC o cédula y nombre para que la factura (SIFEN)
 * salga a su nombre; si no, la cuenta va como consumidor final. Pedido de Pablo 13-10-2026.
 */
function BillDialog({ open, submitting, onClose, onConfirm }: BillDialogProps) {
  const [documento, setDocumento] = useState('')
  const [nombre, setNombre] = useState('')
  if (!open) return null
  const conNombre = documento.trim().length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{t('invoice_title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('invoice_hint')}</p>
        <label className="mt-3 block text-sm font-medium">
          {t('doc_label')}
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-base"
            inputMode="text"
            autoComplete="off"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="80012345-6 / 1234567"
          />
        </label>
        <label className="mt-3 block text-sm font-medium">
          {t('name_label')}
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-base"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <button
          className="mt-4 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={submitting || !conNombre}
          onClick={() => onConfirm({ documento: documento.trim(), nombre: nombre.trim() })}
        >
          {t('bill_with_name')}
        </button>
        <button
          className="mt-2 w-full rounded-md border py-3 text-sm font-medium disabled:opacity-50"
          disabled={submitting}
          onClick={() => onConfirm()}
        >
          {t('bill_no_name')}
        </button>
        <button className="mt-2 w-full py-2 text-sm text-muted-foreground" onClick={onClose}>
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}

export default BillDialog
