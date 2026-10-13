import { useEffect, useState } from 'react'
import { searchCities, type BillData, type CityOption } from '../../lib/api'
import { t } from '../../lib/i18n'

export type { BillData }

interface BillDialogProps {
  open: boolean
  session: string | undefined
  submitting: boolean
  onClose: () => void
  onConfirm: (data?: BillData) => void
}

const inputClass = 'mt-1 w-full rounded-md border px-3 py-2 text-base'

/**
 * Al pedir la cuenta el cliente puede cargar RUC o cédula y nombre para que la factura (SIFEN) salga a
 * su nombre, más correo (recibe el KuDE), dirección y ciudad del catálogo SIFEN; si no, la cuenta va
 * como consumidor final. Pedido de Pablo 13-10-2026.
 */
function BillDialog({ open, session, submitting, onClose, onConfirm }: BillDialogProps) {
  const [documento, setDocumento] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudadTexto, setCiudadTexto] = useState('')
  const [ciudad, setCiudad] = useState<CityOption | null>(null)
  const [opciones, setOpciones] = useState<CityOption[]>([])

  useEffect(() => {
    if (!open || !session || ciudad || ciudadTexto.trim().length < 2) {
      setOpciones([])
      return
    }
    const timer = setTimeout(() => {
      searchCities(session, ciudadTexto.trim())
        .then(setOpciones)
        .catch(() => setOpciones([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [ciudadTexto, ciudad, open, session])

  if (!open) return null
  const conNombre = documento.trim().length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{t('invoice_title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('invoice_hint')}</p>
        <label className="mt-3 block text-sm font-medium">
          {t('doc_label')}
          <input className={inputClass} autoComplete="off" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="80012345-6 / 1234567" />
        </label>
        <label className="mt-3 block text-sm font-medium">
          {t('name_label')}
          <input className={inputClass} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-medium">
          {t('email_label')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
          <input className={inputClass} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-medium">
          {t('address_label')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
          <input className={inputClass} autoComplete="street-address" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </label>
        <label className="relative mt-3 block text-sm font-medium">
          {t('city_label')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
          <input
            className={inputClass}
            autoComplete="off"
            value={ciudad ? ciudad.ciudad_descripcion : ciudadTexto}
            onChange={(e) => {
              setCiudad(null)
              setCiudadTexto(e.target.value)
            }}
          />
          {opciones.length > 0 && (
            <ul className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow">
              {opciones.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setCiudad(c)
                      setOpciones([])
                    }}
                  >
                    {c.ciudad_descripcion} <span className="text-muted-foreground">· {c.departamento_descripcion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <button
          className="mt-4 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={submitting || !conNombre}
          onClick={() =>
            onConfirm({
              documento: documento.trim(),
              nombre: nombre.trim(),
              email: email.trim(),
              direccion: direccion.trim(),
              ciudad: ciudad?.name,
            })
          }
        >
          {t('bill_with_name')}
        </button>
        <button className="mt-2 w-full rounded-md border py-3 text-sm font-medium disabled:opacity-50" disabled={submitting} onClick={() => onConfirm()}>
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
