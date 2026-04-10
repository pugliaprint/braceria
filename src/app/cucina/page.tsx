'use client'
/**
 * app/cucina/page.tsx
 * Dashboard cucina — Kanban real-time per gestire gli ordini.
 * Accesso tramite PIN (impostato dall'admin nei settings).
 * Ottimizzata per tablet in orizzontale, testi grandi.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import toast from 'react-hot-toast'

type StatoOrdine = 'nuovo' | 'in_preparazione' | 'pronto' | 'consegnato'

interface VoceOrdine {
  tipo: 'piatto' | 'panino_personalizzato'
  nomePiatto: string
  quantita: number
  prezzoUnitario: number
  note?: string
  ingredienti?: Array<{ nomeIngrediente: string; categoria: string }>
}

interface Ordine {
  _id: string
  numeroOrdine: number
  tipo: 'tavolo' | 'delivery'
  stato: StatoOrdine
  numeroTavolo?: number
  nomeCliente?: string
  indirizzo?: string
  voci: VoceOrdine[]
  totale: number
  note?: string
  createdAt: string
}

// ---- Configurazione colonne Kanban ----
const COLONNE: Array<{
  stato: StatoOrdine
  label: string
  emoji: string
  colore: string
  bordo: string
  bg: string
  prossimo?: StatoOrdine
  labelProssimo?: string
}> = [
  {
    stato: 'nuovo',
    label: 'NUOVI ORDINI',
    emoji: '🔴',
    colore: 'text-red-300',
    bordo: 'border-red-700/60',
    bg: 'bg-red-950/30',
    prossimo: 'in_preparazione',
    labelProssimo: '👨‍🍳 In Preparazione',
  },
  {
    stato: 'in_preparazione',
    label: 'IN PREPARAZIONE',
    emoji: '🟡',
    colore: 'text-yellow-300',
    bordo: 'border-yellow-700/60',
    bg: 'bg-yellow-950/30',
    prossimo: 'pronto',
    labelProssimo: '✅ Pronto',
  },
  {
    stato: 'pronto',
    label: 'PRONTI',
    emoji: '🟢',
    colore: 'text-green-300',
    bordo: 'border-green-700/60',
    bg: 'bg-green-950/30',
    prossimo: 'consegnato',
    labelProssimo: '🎉 Consegnato',
  },
]

// ---- Componente PIN ----
function PinScreen({ onSuccess }: { onSuccess: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  const [errore, setErrore] = useState(false)

  const aggiungiCifra = (c: string) => {
    if (pin.length >= 4) return
    const nuovoPin = pin + c
    setPin(nuovoPin)
    setErrore(false)
    if (nuovoPin.length === 4) {
      setTimeout(() => onSuccess(nuovoPin), 100)
    }
  }

  const cancella = () => {
    setPin(p => p.slice(0, -1))
    setErrore(false)
  }

  return (
    <div className="min-h-screen bg-brace-nero flex items-center justify-center px-4">
      <div className="w-full max-w-xs text-center">
        <div className="text-6xl mb-5">🍳</div>
        <h1 className="font-display text-3xl font-black text-brace-crema mb-2">
          Dashboard Cucina
        </h1>
        <p className="text-brace-testo-soft mb-8">Inserisci il PIN per accedere</p>

        {/* Indicatori PIN */}
        <div className="flex justify-center gap-4 mb-8">
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > i
                  ? errore ? 'bg-red-500 border-red-500' : 'bg-brace-arancio border-brace-arancio'
                  : 'border-brace-fumo'
              }`}
            />
          ))}
        </div>

        {/* Tastierino numerico */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((c, i) => (
            <button
              key={i}
              onClick={() => c === '⌫' ? cancella() : c !== '' && aggiungiCifra(c)}
              disabled={c === ''}
              className={`h-16 rounded-2xl text-2xl font-bold transition-all active:scale-90
                ${c === '' ? 'invisible' : c === '⌫'
                  ? 'bg-brace-carbone text-brace-testo-soft hover:text-brace-testo border border-brace-fumo'
                  : 'bg-brace-carbone text-brace-crema hover:bg-brace-fumo border border-brace-fumo active:bg-brace-brace/30'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {errore && (
          <p className="text-red-400 text-sm mt-4 animate-bounce-in">PIN non corretto</p>
        )}
      </div>
    </div>
  )
}

// ---- Card Ordine ----
function OrdineCard({
  ordine,
  colonna,
  onCambiaStato,
}: {
  ordine: Ordine
  colonna: typeof COLONNE[number]
  onCambiaStato: (id: string, stato: StatoOrdine) => void
}) {
  const minuti = Math.floor(
    (Date.now() - new Date(ordine.createdAt).getTime()) / 60000
  )
  const isVecchio = ordine.stato === 'nuovo' && minuti >= 10

  return (
    <div
      className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all duration-300
        ${isVecchio ? 'border-red-500 animate-pulse-slow' : colonna.bordo}
        ${colonna.bg}`}
    >
      {/* Header ordine */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-black text-brace-crema">
              #{ordine.numeroOrdine}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
              ordine.tipo === 'tavolo'
                ? 'bg-blue-900/50 text-blue-300 border-blue-700/50'
                : 'bg-orange-900/50 text-orange-300 border-orange-700/50'
            }`}>
              {ordine.tipo === 'tavolo' ? `🍽 Tavolo ${ordine.numeroTavolo}` : '🛵 Delivery'}
            </span>
          </div>
          {ordine.tipo === 'delivery' && ordine.nomeCliente && (
            <p className="text-brace-testo-soft text-sm mt-0.5">{ordine.nomeCliente}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-sm font-mono font-semibold ${isVecchio ? 'text-red-400' : 'text-brace-testo-soft'}`}>
            {minuti < 1 ? 'adesso' : `${minuti} min`}
          </span>
          <p className="text-brace-testo-soft text-xs">
            {new Date(ordine.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Voci ordine */}
      <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
        {ordine.voci.map((voce, i) => (
          <div key={i}>
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0 mt-0.5">
                {voce.tipo === 'panino_personalizzato' ? '🥪' : '🍽️'}
              </span>
              <div className="flex-1">
                <p className="text-brace-crema font-bold text-lg leading-tight">
                  {voce.quantita > 1 && (
                    <span className="text-brace-arancio mr-1">{voce.quantita}×</span>
                  )}
                  {voce.nomePiatto}
                </p>
                {/* Ingredienti panino */}
                {voce.tipo === 'panino_personalizzato' && voce.ingredienti && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {voce.ingredienti.map((ing, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-brace-fumo/60 text-brace-testo-soft">
                        {ing.nomeIngrediente}
                      </span>
                    ))}
                  </div>
                )}
                {voce.note && (
                  <p className="text-yellow-300 text-sm mt-1 italic">⚠️ {voce.note}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note generali ordine */}
      {ordine.note && (
        <div className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl p-2.5">
          <p className="text-yellow-300 text-sm">📝 {ordine.note}</p>
        </div>
      )}

      {/* Indirizzo delivery */}
      {ordine.tipo === 'delivery' && ordine.indirizzo && ordine.stato === 'pronto' && (
        <div className="bg-orange-900/30 border border-orange-700/40 rounded-xl p-2.5">
          <p className="text-orange-300 text-sm font-semibold">📍 {ordine.indirizzo}</p>
        </div>
      )}

      {/* Pulsante avanza stato */}
      {colonna.prossimo && (
        <button
          onClick={() => onCambiaStato(ordine._id, colonna.prossimo!)}
          className="w-full py-3.5 rounded-xl font-bold text-base
                     bg-brace-carbone border-2 border-brace-fumo
                     hover:bg-gradient-fuoco hover:border-transparent hover:text-white hover:shadow-fuoco
                     text-brace-testo transition-all duration-200 active:scale-98 mt-1"
        >
          {colonna.labelProssimo}
        </button>
      )}
    </div>
  )
}

// ---- Dashboard principale ----
export default function CucinaPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [pinValido, setPinValido] = useState(false)
  const [ordini, setOrdini]       = useState<Ordine[]>([])
  const [loading, setLoading]     = useState(true)
  const audioCtx = useRef<AudioContext | null>(null)
  const pinRef = useRef<string>('')

  // Suono di notifica per nuovo ordine
  const riproduciSuono = useCallback(() => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtx.current

      // Sequenza di toni: bip bip bip
      const tempi = [0, 0.15, 0.30]
      tempi.forEach(t => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.4, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12)
        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + 0.12)
      })
    } catch (e) {
      console.warn('Audio non disponibile:', e)
    }
  }, [])

  // Carica ordini attivi
  const caricaOrdini = useCallback(async (pinCode: string) => {
    try {
      const res = await fetch('/api/orders?limit=80', {
        headers: { 'x-cucina-pin': pinCode },
      })
      if (res.status === 401) {
        setPinValido(false)
        setPin(null)
        return
      }
      const data = await res.json()
      // Mostra solo ordini non consegnati/annullati
      setOrdini(data.filter((o: Ordine) =>
        !['consegnato', 'annullato'].includes(o.stato)
      ))
    } catch {
      toast.error('Errore caricamento ordini')
    } finally {
      setLoading(false)
    }
  }, [])

  // Verifica PIN
  const verificaPin = async (pinCode: string) => {
    const res = await fetch('/api/orders?limit=1', {
      headers: { 'x-cucina-pin': pinCode },
    })
    if (res.ok) {
      setPin(pinCode)
      pinRef.current = pinCode
      setPinValido(true)
      localStorage.setItem('cucina_pin', pinCode)
      caricaOrdini(pinCode)
    } else {
      // Segnala errore alla schermata PIN
      toast.error('PIN non corretto')
    }
  }

  // Tenta PIN salvato
  useEffect(() => {
    const savedPin = localStorage.getItem('cucina_pin')
    if (savedPin) verificaPin(savedPin)
    else setLoading(false)
  }, [])

  // WebSocket Pusher per aggiornamenti real-time
  useEffect(() => {
    if (!pinValido) return
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!key) return

    const pusher = new Pusher(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
    })
    const ch = pusher.subscribe('cucina')

    // Nuovo ordine in arrivo
    ch.bind('nuovo-ordine', (data: { ordine: Ordine }) => {
      setOrdini(prev => {
        const esiste = prev.find(o => o._id === data.ordine._id)
        if (esiste) return prev
        return [data.ordine, ...prev]
      })
      riproduciSuono()
      toast.custom(
        () => (
          <div className="bg-red-900 border border-red-600 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="text-red-200 font-bold">Nuovo ordine #{data.ordine.numeroOrdine}</p>
              <p className="text-red-300 text-sm">
                {data.ordine.tipo === 'tavolo' ? `Tavolo ${data.ordine.numeroTavolo}` : 'Delivery'}
              </p>
            </div>
          </div>
        ),
        { duration: 6000 }
      )
    })

    // Aggiornamento stato (da altri client)
    ch.bind('aggiornamento-stato', (data: { ordineId: string; nuovoStato: StatoOrdine }) => {
      setOrdini(prev => {
        if (['consegnato', 'annullato'].includes(data.nuovoStato)) {
          return prev.filter(o => o._id !== data.ordineId)
        }
        return prev.map(o =>
          o._id === data.ordineId ? { ...o, stato: data.nuovoStato } : o
        )
      })
    })

    return () => {
      ch.unbind_all()
      pusher.unsubscribe('cucina')
    }
  }, [pinValido, riproduciSuono])

  // Aggiornamento stato ordine
  const cambiaStato = async (ordineId: string, nuovoStato: StatoOrdine) => {
    // Aggiornamento ottimistico UI
    setOrdini(prev => {
      if (['consegnato', 'annullato'].includes(nuovoStato)) {
        return prev.filter(o => o._id !== ordineId)
      }
      return prev.map(o => o._id === ordineId ? { ...o, stato: nuovoStato } : o)
    })

    try {
      const res = await fetch(`/api/orders/${ordineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-cucina-pin': pinRef.current,
        },
        body: JSON.stringify({ stato: nuovoStato }),
      })
      if (!res.ok) {
        toast.error('Errore aggiornamento')
        caricaOrdini(pinRef.current)
      }
    } catch {
      toast.error('Errore di rete')
      caricaOrdini(pinRef.current)
    }
  }

  // ---- Render ----
  if (!pinValido) {
    return <PinScreen onSuccess={verificaPin} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brace-nero flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl animate-pulse block mb-4">🍳</span>
          <p className="text-brace-testo-soft text-xl">Caricamento cucina...</p>
        </div>
      </div>
    )
  }

  const ordiniPerStato = (stato: StatoOrdine) =>
    ordini.filter(o => o.stato === stato)

  const totaleOrdini = ordini.length

  return (
    <div className="min-h-screen bg-brace-nero flex flex-col">

      {/* Header cucina */}
      <header className="bg-brace-carbone border-b-2 border-brace-fumo px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-fuoco flex items-center justify-center">
            <span className="text-xl">🍳</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-black text-brace-crema leading-none">
              Cucina
            </h1>
            <p className="text-brace-testo-soft text-xs">
              {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              {' '}• {totaleOrdini} ordini attivi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Contatori per colonna */}
          {COLONNE.map(col => {
            const count = ordiniPerStato(col.stato).length
            return (
              <div key={col.stato} className="text-center">
                <div className={`font-display text-2xl font-black ${col.colore}`}>{count}</div>
                <div className="text-brace-testo-soft text-xs">{col.emoji}</div>
              </div>
            )
          })}

          <button
            onClick={() => {
              localStorage.removeItem('cucina_pin')
              setPinValido(false)
              setPin(null)
            }}
            className="btn-ghost text-xs px-3 py-2 border border-brace-fumo rounded-xl ml-2"
          >
            🔒 Esci
          </button>
        </div>
      </header>

      {/* Kanban board */}
      <main className="flex-1 flex gap-0 overflow-hidden">
        {COLONNE.map(colonna => {
          const ordiniColonna = ordiniPerStato(colonna.stato)
          return (
            <div
              key={colonna.stato}
              className="flex-1 flex flex-col min-w-0 border-r border-brace-fumo/30 last:border-r-0"
            >
              {/* Header colonna */}
              <div className={`px-3 py-3 border-b-2 ${colonna.bordo} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{colonna.emoji}</span>
                  <h2 className={`font-display text-base font-black ${colonna.colore} tracking-wide`}>
                    {colonna.label}
                  </h2>
                </div>
                {ordiniColonna.length > 0 && (
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center
                                   text-sm font-black ${colonna.bg} border ${colonna.bordo} ${colonna.colore}`}>
                    {ordiniColonna.length}
                  </span>
                )}
              </div>

              {/* Ordini della colonna */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                {ordiniColonna.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center opacity-30 py-12">
                    <div className="text-center">
                      <span className="text-4xl block mb-2">{colonna.emoji}</span>
                      <p className="text-brace-testo-soft text-sm">Nessun ordine</p>
                    </div>
                  </div>
                ) : (
                  ordiniColonna.map(ordine => (
                    <OrdineCard
                      key={ordine._id}
                      ordine={ordine}
                      colonna={colonna}
                      onCambiaStato={cambiaStato}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
