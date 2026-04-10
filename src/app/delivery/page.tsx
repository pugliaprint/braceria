'use client'
/**
 * app/delivery/page.tsx
 * Pagina ordine delivery.
 * Flusso: Menu → Carrello → Dati consegna → Conferma
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import MenuList from '@/components/menu/MenuList'
import CartDrawer from '@/components/menu/CartDrawer'
import PaninoBuilder from '@/components/builder/PaninoBuilder'
import { useCart } from '@/components/providers/CartProvider'

type Vista = 'menu' | 'builder' | 'checkout' | 'conferma'

const COSTO_CONSEGNA = 1.00

export default function DeliveryPage() {
  const { state, setTipo, totale, totalePezzi, clear } = useCart()

  const [vista, setVista]           = useState<Vista>('menu')
  const [cartAperto, setCartAperto] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [deliveryAttivo, setDeliveryAttivo] = useState(true)
  const [numeroOrdine, setNumeroOrdine]     = useState<number | null>(null)

  // Form consegna
  const [nome, setNome]         = useState('')
  const [telefono, setTelefono] = useState('')
  const [indirizzo, setIndirizzo] = useState('')
  const [note, setNote]         = useState('')

  // Verifica se delivery è attivo
  useEffect(() => {
    fetch('/api/settings?pubblico=true')
      .then(r => r.json())
      .then(s => setDeliveryAttivo(s.deliveryAttivo ?? true))
      .catch(() => {})
    setTipo('delivery')
  }, [setTipo])

  const totaleConConsegna = totale + COSTO_CONSEGNA

  const inviaOrdine = async () => {
    if (!nome.trim() || !telefono.trim() || !indirizzo.trim()) {
      toast.error('Compila tutti i campi obbligatori')
      return
    }
    if (state.items.length === 0) {
      toast.error('Il carrello è vuoto')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'delivery',
          nomeCliente: nome.trim(),
          telefonoCliente: telefono.trim(),
          indirizzo: indirizzo.trim(),
          note: note.trim() || undefined,
          voci: state.items.map(item => ({
            tipo: item.tipo,
            menuItemId: item.menuItemId,
            nomePiatto: item.nomePiatto,
            ingredienti: item.ingredienti,
            quantita: item.quantita,
            prezzoUnitario: item.prezzoUnitario,
            note: item.note,
          })),
          totale: totaleConConsegna,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Errore invio ordine')
        return
      }

      setNumeroOrdine(data.numeroOrdine)
      clear()
      setVista('conferma')
    } catch {
      toast.error('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  // Delivery disattivo
  if (!deliveryAttivo) {
    return (
      <div className="min-h-screen bg-brace-nero bg-texture-carbone flex flex-col">
        <header className="px-4 pt-safe pt-5 pb-4 flex items-center gap-3">
          <Link href="/" className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-display text-xl font-bold text-brace-crema">Ordina a Domicilio</h1>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 text-center">
          <div>
            <span className="text-6xl block mb-4">😔</span>
            <h2 className="font-display text-2xl font-bold text-brace-crema mb-3">
              Delivery momentaneamente sospeso
            </h2>
            <p className="text-brace-testo-soft mb-6 leading-relaxed">
              Il servizio di consegna è temporaneamente non disponibile.<br />
              Passa da noi o prenota un tavolo!
            </p>
            <Link href="/prenota" className="btn-primary">📅 Prenota un Tavolo</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brace-nero flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-brace-nero/95 backdrop-blur-sm border-b border-brace-fumo/50">
        <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
          <div className="flex items-center gap-2">
            {vista === 'checkout' ? (
              <button onClick={() => setVista('menu')} className="btn-ghost p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <Link href="/" className="btn-ghost p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <div>
              <h1 className="font-display text-xl font-bold text-brace-crema">
                {vista === 'checkout' ? 'Dati Consegna' : '🛵 Ordina a Domicilio'}
              </h1>
              <p className="text-brace-testo-soft text-xs">
                {vista === 'checkout' ? 'Solo Sannicandro di Bari' : `Consegna €${COSTO_CONSEGNA.toFixed(2)} • Contanti o POS`}
              </p>
            </div>
          </div>

          {/* Carrello (solo in vista menu) */}
          {(vista === 'menu' || vista === 'builder') && totalePezzi > 0 && (
            <button
              onClick={() => setCartAperto(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-brace-carbone border border-brace-fumo
                         hover:border-brace-brace active:scale-95 transition-all"
            >
              <span>🛒</span>
              <span className="text-brace-testo text-sm font-semibold">{totalePezzi}</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-fuoco
                               text-white text-xs flex items-center justify-center font-bold shadow-fuoco">
                {totalePezzi}
              </span>
            </button>
          )}
        </div>

        {/* Tab menu / builder */}
        {(vista === 'menu' || vista === 'builder') && (
          <div className="flex px-4 pb-2 gap-2">
            <button
              onClick={() => setVista('menu')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                vista === 'menu' ? 'bg-brace-fumo text-brace-crema' : 'text-brace-testo-soft'
              }`}
            >
              🍽️ Menu
            </button>
            <button
              onClick={() => setVista('builder')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                vista === 'builder'
                  ? 'bg-gradient-fuoco text-white shadow-fuoco'
                  : 'text-brace-testo-soft border border-brace-fumo'
              }`}
            >
              🥪 Crea Panino
            </button>
          </div>
        )}
      </header>

      {/* Contenuto */}
      <main className="flex-1 overflow-y-auto">

        {/* ---- VISTA MENU ---- */}
        {vista === 'menu' && (
          <MenuList
            onApriBuilder={() => setVista('builder')}
            showBuilder={true}
          />
        )}

        {/* ---- VISTA BUILDER ---- */}
        {vista === 'builder' && (
          <div className="px-4 py-6">
            <PaninoBuilder
              compact
              onComplete={() => {
                setVista('menu')
                setCartAperto(true)
              }}
            />
          </div>
        )}

        {/* ---- VISTA CHECKOUT ---- */}
        {vista === 'checkout' && (
          <div className="px-4 py-6 pb-32 max-w-md mx-auto">

            {/* Riepilogo ordine compatto */}
            <div className="card p-4 mb-6">
              <h3 className="text-xs uppercase tracking-wider text-brace-testo-soft mb-3">
                Il tuo ordine ({state.items.length} articoli)
              </h3>
              <div className="flex flex-col gap-1.5">
                {state.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-brace-testo truncate">
                      {item.quantita}x {item.nomePiatto}
                    </span>
                    <span className="font-mono text-brace-arancio flex-shrink-0 ml-2">
                      €{(item.prezzoUnitario * item.quantita).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-brace-fumo/50 pt-2 mt-1">
                  <div className="flex justify-between text-sm text-brace-testo-soft">
                    <span>Consegna</span>
                    <span className="font-mono">€{COSTO_CONSEGNA.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-brace-crema mt-1">
                    <span>Totale</span>
                    <span className="font-mono text-gradient-fuoco">€{totaleConConsegna.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form dati consegna */}
            <h2 className="font-display text-xl font-bold text-brace-crema mb-5">
              Dove consegniamo?
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Nome e Cognome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Mario Rossi"
                  className="input"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label">Telefono *</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="input"
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="label">Indirizzo di Consegna *</label>
                <input
                  type="text"
                  value={indirizzo}
                  onChange={e => setIndirizzo(e.target.value)}
                  placeholder="Via Roma 12, Sannicandro di Bari"
                  className="input"
                  autoComplete="street-address"
                />
                <p className="text-xs text-brace-testo-soft mt-1.5">
                  ⚠️ Consegniamo solo a Sannicandro di Bari
                </p>
              </div>
              <div>
                <label className="label">Note (opzionale)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Campanello rotto, citofono 3, scala B..."
                  className="input resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Metodo pagamento */}
            <div className="card p-4 mt-5">
              <h3 className="text-sm font-semibold text-brace-testo mb-2">💳 Pagamento</h3>
              <p className="text-brace-testo-soft text-sm">
                Il pagamento avviene alla consegna. Accettiamo contanti e POS (bancomat/carta di credito).
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={inviaOrdine}
              disabled={loading || !nome.trim() || !telefono.trim() || !indirizzo.trim()}
              className="btn-primary w-full text-lg py-4 mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Invio in corso...
                </>
              ) : (
                `🛵 Conferma Ordine — €${totaleConConsegna.toFixed(2)}`
              )}
            </button>
          </div>
        )}

        {/* ---- VISTA CONFERMA ---- */}
        {vista === 'conferma' && (
          <div className="px-5 py-10 max-w-md mx-auto text-center animate-bounce-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-fuoco shadow-fuoco-lg mb-5">
              <span className="text-5xl">🛵</span>
            </div>
            <h2 className="font-display text-3xl font-black text-brace-crema mb-2">
              Ordine Confermato!
            </h2>
            {numeroOrdine && (
              <p className="text-brace-testo-soft mb-1">Ordine #{numeroOrdine}</p>
            )}
            <p className="text-brace-testo-soft mb-8 leading-relaxed">
              Il tuo ordine è stato ricevuto dalla cucina.<br />
              Ti consegneremo il prima possibile a <strong className="text-brace-testo">{indirizzo}</strong>.
            </p>

            <div className="card p-4 mb-6 text-left">
              <p className="text-sm text-brace-testo-soft">
                📞 Hai bisogno di modificare l'ordine? Chiamaci subito!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setVista('menu'); setNome(''); setTelefono(''); setIndirizzo(''); setNote('') }}
                className="btn-primary py-4"
              >
                + Nuovo Ordine
              </button>
              <Link href="/" className="btn-ghost text-center py-3">
                🏠 Torna alla Home
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar carrello (solo in menu/builder) */}
      {(vista === 'menu' || vista === 'builder') && totalePezzi > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-brace-nero/95 backdrop-blur-sm border-t border-brace-fumo/50">
          <button
            onClick={() => setCartAperto(true)}
            className="btn-primary w-full text-base py-4 flex items-center justify-between px-5"
          >
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
              {totalePezzi}
            </span>
            <span>Vedi carrello</span>
            <span className="font-mono">€{totaleConConsegna.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Carrello Drawer */}
      <CartDrawer
        open={cartAperto}
        onClose={() => setCartAperto(false)}
        onCheckout={() => { setCartAperto(false); setVista('checkout') }}
        tipoOrdine="delivery"
        costoConsegna={COSTO_CONSEGNA}
      />
    </div>
  )
}
