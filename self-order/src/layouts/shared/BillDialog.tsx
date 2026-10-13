import { useEffect, useState } from 'react'
import { lookupCustomer, searchCities, type BillData, type CityOption, type CustomerLookup } from '../../lib/api'
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
const primaryBtn = 'mt-4 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50'
const secondaryBtn = 'mt-2 w-full rounded-md border py-3 text-sm font-medium disabled:opacity-50'

/**
 * Pedir la cuenta en dos pasos (Pablo 13-10-2026): 1) RUC o cédula → se busca el cliente;
 * 2a) existe → se confirma con su nombre (y se completan sólo los datos que le faltan);
 * 2b) no existe → cliente nuevo: nombre, correo, dirección y ciudad del catálogo SIFEN.
 * «Sin nombre» deja la cuenta como consumidor final.
 */
function BillDialog({ open, session, submitting, onClose, onConfirm }: BillDialogProps) {
  const [documento, setDocumento] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [lookup, setLookup] = useState<CustomerLookup | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  async function buscar() {
    if (!session || !documento.trim()) return
    setBuscando(true)
    setError(null)
    try {
      setLookup(await lookupCustomer(session, documento.trim()))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lookup_error'))
    } finally {
      setBuscando(false)
    }
  }

  function volver() {
    setLookup(null)
    setError(null)
  }

  const sinNombre = Boolean(lookup?.sin_nombre)
  const askEmail = !sinNombre && (!lookup?.found || lookup.missing?.email)
  const askAddress = !sinNombre && (!lookup?.found || lookup.missing?.direccion)
  const askCity = !sinNombre && (!lookup?.found || lookup.missing?.ciudad)
  const puedeConfirmar = lookup?.found || nombre.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{t('invoice_title')}</h2>

        {!lookup && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">{t('invoice_hint')}</p>
            <label className="mt-3 block text-sm font-medium">
              {t('doc_label')}
              <input className={inputClass} autoComplete="off" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="80012345-6 / 1234567" />
            </label>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <button className={primaryBtn} disabled={buscando || !documento.trim()} onClick={buscar}>
              {buscando ? t('searching') : t('search')}
            </button>
            <button className={secondaryBtn} disabled={submitting} onClick={() => onConfirm()}>
              {t('bill_no_name')}
            </button>
          </>
        )}

        {lookup && (
          <>
            {lookup.found ? (
              <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                <div className="text-muted-foreground">{sinNombre ? t('no_name_customer') : t('existing_customer')}</div>
                <div className="text-base font-semibold">{sinNombre ? t('no_name') : lookup.customer_name}</div>
                <div className="text-muted-foreground">{lookup.documento}</div>
              </div>
            ) : (
              <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                <div className="font-medium">{t('new_customer')}</div>
                <div className="text-muted-foreground">{lookup.documento}</div>
              </div>
            )}
            {!lookup.found && (
              <label className="mt-3 block text-sm font-medium">
                {t('name_label')}
                <input className={inputClass} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
            )}
            {askEmail && (
              <label className="mt-3 block text-sm font-medium">
                {t('email_label')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
                <input className={inputClass} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            )}
            {askAddress && (
              <label className="mt-3 block text-sm font-medium">
                {t('address_label')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
                <input className={inputClass} autoComplete="street-address" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </label>
            )}
            {askCity && (
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
            )}
            <button
              className={primaryBtn}
              disabled={submitting || !puedeConfirmar}
              onClick={() =>
                onConfirm({
                  documento: lookup.documento,
                  nombre: nombre.trim(),
                  email: email.trim(),
                  direccion: direccion.trim(),
                  ciudad: ciudad?.name,
                })
              }
            >
              {sinNombre ? t('bill_no_name') : lookup.found ? t('bill_as', { name: lookup.customer_name ?? '' }) : t('bill_with_name')}
            </button>
            <button className={secondaryBtn} disabled={submitting} onClick={volver}>
              {t('change_doc')}
            </button>
          </>
        )}

        <button className="mt-2 w-full py-2 text-sm text-muted-foreground" onClick={onClose}>
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}

export default BillDialog
