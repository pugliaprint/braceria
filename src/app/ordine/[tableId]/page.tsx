'use client'
/**
 * app/ordine/[tableId]/page.tsx
 * Pagina ordine al tavolo — si apre dal QR code sul tavolo.
 * URL: /ordine/5  (dove 5 è il numero del tavolo)
 *
 * Flusso:
 * 1. Mostra menu sfogliabile
 * 2. Cliente aggiunge al carrello
 * 3. Invia ordine → cucina riceve in real-time
 * 4. Cliente traccia lo stato del suo ordine
 */
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import MenuList from '@/components/menu/MenuList'
import CartDrawer from '@/components/menu/CartDrawer'
import PaninoBuilder from '@/components/builder/PaninoBuilder'
import { useCart } from '@/components/providers/CartProvider'
import OrdineStatus from '@/components/menu/OrdineStatus'

type Vista = 'menu' | 'builder' | 'status'

export default function OrdineAlTavoloPage() {
  const params = useParams()
  const tableId = Number(params.tableId)
  const { state, setTipo, totale, totalePezzi, clear } = useCart()

  const [vista, setVista] = useState<Vista>('menu')
  const [cartAperto, setCartAperto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ordineInviato, setOrdineInviato] = useState<string | null>(null)

  // Imposta tipo tavolo al mount
  useEffect(() => {
    if (tableId && !isNaN(tableId)) {
      setTipo('tavolo', tableId)
    }
  }, [tableId, setTipo])

  // Recupera ordine attivo da localStorage (se il cliente ha già ordinato)
  useEffect(() => {
    const ordineSalvato = localStorage.getItem(`ordine_tavolo_${tableId}`)
    if (ordineSalvato) setOrdineInviato(ordineSalvato)
  }, [tableId])

  if (isNaN(tableId) || tableId <= 0) {
    return (
      <div className="min-h-screen bg-brace-nero flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl block mb-4">❓</span>
          <h1 className="font-display text-2xl font-bold text-brace-crema mb-2">
            QR Code non valido
          </h1>
          <p className="text-brace-testo-soft mb-6">
            Scannerizza il QR code sul tuo tavolo per ordinare.
          </p>
          <Link href="/" className="btn-primary">Torna alla Home</Link>
        </div>
      </div>
    )
  }

  const inviaOrdine = async () => {
    if (state.items.length === 0) return
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'tavolo',
          numeroTavolo: tableId,
          voci: state.items.map(item => ({
            tipo: item.tipo,
            menuItemId: item.menuItemId,
            nomePiatto: item.nomePiatto,
            ingredienti: item.ingredienti,
            quantita: item.quantita,
            prezzoUnitario: item.prezzoUnitario,
            note: item.note,
          })),
          totale,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Errore invio ordine')
        return
      }

      // Salva ordineId per tracciamento
      localStorage.setItem(`ordine_tavolo_${tableId}`, data._id)
      setOrdineInviato(data._id)
      clear()
      setCartAperto(false)
      setVista('status')
      toast.success('🔥 Ordine inviato alla cucina!')
    } catch {
      toast.error('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brace-nero flex flex-col">

      {/* Header tavolo */}
      <header className="sticky top-0 z-40 bg-brace-nero/95 backdrop-blur-sm border-b border-brace-fumo/50">
        <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-fuoco flex items-center justify-center shadow-fuoco">
              <span className="font-display text-lg font-black text-white">{tableId}</span>
            </div>
            <div>
              <p className="font-display font-bold text-brace-crema text-base leading-none">
                Tavolo {tableId}
              </p>
              <p className="text-brace-testo-soft text-xs">Braceria Sannicandro</p>
            </div>
          </div>

          {/* Carrello */}
          {vista === 'menu' && (
            <button
              onClick={() => setCartAperto(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-brace-carbone border border-brace-fumo
                         hover:border-brace-brace active:scale-95 transition-all"
            >
              <span>🛒</span>
              {totalePezzi > 0 && (
                <>
                  <span className="text-brace-testo text-sm font-semibold">{totalePezzi}</span>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-fuoco
                                   text-white text-xs flex items-center justify-center font-bold shadow-fuoco animate-bounce-in">
                    {totalePezzi}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Tab menu / builder */}
        {vista !== 'status' && (
          <div className="flex px-4 pb-2 gap-2">
            <button
              onClick={() => setVista('menu')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                vista === 'menu'
                  ? 'bg-brace-fumo text-brace-crema'
                  : 'text-brace-testo-soft hover:text-brace-testo'
              }`}
            >
              🍽️ Menu
            </button>
            <button
              onClick={() => setVista('builder')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                vista === 'builder'
                  ? 'bg-gradient-fuoco text-white shadow-fuoco'
                  : 'text-brace-testo-soft hover:text-brace-testo border border-brace-fumo'
              }`}
            >
              🥪 Crea Panino
            </button>
          </div>
        )}
      </header>

      {/* Contenuto */}
      <main className="flex-1 overflow-y-auto">
        {vista === 'menu' && (
          <MenuList
            onApriBuilder={() => setVista('builder')}
            showBuilder={true}
          />
        )}

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

        {vista === 'status' && ordineInviato && (
          <div className="px-4 py-6">
            <OrdineStatus ordineId={ordineInviato} numeroTavolo={tableId} />
            <button
              onClick={() => {
                setVista('menu')
                setOrdineInviato(null)
                localStorage.removeItem(`ordine_tavolo_${tableId}`)
              }}
              className="btn-ghost w-full text-center mt-4"
            >
              + Aggiungi altri piatti
            </button>
          </div>
        )}
      </main>

      {/* Bottom bar carrello */}
      {vista === 'menu' && totalePezzi > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-brace-nero/95 backdrop-blur-sm border-t border-brace-fumo/50">
          <button
            onClick={() => setCartAperto(true)}
            className="btn-primary w-full text-base py-4 flex items-center justify-between px-5"
          >
            <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
              {totalePezzi}
            </span>
            <span>Vedi ordine</span>
            <span className="font-mono">€{totale.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Carrello Drawer */}
      <CartDrawer
        open={cartAperto}
        onClose={() => setCartAperto(false)}
        onCheckout={inviaOrdine}
        tipoOrdine="tavolo"
      />
    </div>
  )
}
