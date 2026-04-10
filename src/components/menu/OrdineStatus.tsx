'use client'
/**
 * components/menu/OrdineStatus.tsx
 * Tracciamento stato ordine in tempo reale via Pusher.
 * Mostra: ricevuto → in preparazione → pronto
 */
import { useState, useEffect } from 'react'
import Pusher from 'pusher-js'

type StatoOrdine = 'nuovo' | 'in_preparazione' | 'pronto' | 'consegnato' | 'annullato'

interface Ordine {
  _id: string
  numeroOrdine: number
  stato: StatoOrdine
  voci: Array<{ nomePiatto: string; quantita: number; prezzoUnitario: number }>
  totale: number
  createdAt: string
}

const STATI: Record<StatoOrdine, { label: string; emoji: string; colore: string; bg: string }> = {
  nuovo:          { label: 'Ricevuto',       emoji: '📨', colore: 'text-red-300',    bg: 'bg-red-900/30 border-red-700/50' },
  in_preparazione:{ label: 'In Preparazione',emoji: '👨‍🍳', colore: 'text-yellow-300', bg: 'bg-yellow-900/30 border-yellow-700/50' },
  pronto:         { label: 'Pronto!',         emoji: '✅', colore: 'text-green-300',  bg: 'bg-green-900/30 border-green-700/50' },
  consegnato:     { label: 'Consegnato',      emoji: '🎉', colore: 'text-blue-300',   bg: 'bg-blue-900/30 border-blue-700/50' },
  annullato:      { label: 'Annullato',       emoji: '❌', colore: 'text-gray-400',   bg: 'bg-gray-900/30 border-gray-700/50' },
}

const STEPS: StatoOrdine[] = ['nuovo', 'in_preparazione', 'pronto']

interface OrdineStatusProps {
  ordineId: string
  numeroTavolo: number
}

export default function OrdineStatus({ ordineId, numeroTavolo }: OrdineStatusProps) {
  const [ordine, setOrdine] = useState<Ordine | null>(null)
  const [loading, setLoading] = useState(true)

  // Carica ordine
  useEffect(() => {
    fetch(`/api/orders/${ordineId}`)
      .then(r => r.json())
      .then(setOrdine)
      .finally(() => setLoading(false))
  }, [ordineId])

  // Real-time updates via Pusher
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu'
    if (!pusherKey) return

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster })
    const channel = pusher.subscribe('cucina')

    channel.bind('aggiornamento-stato', (data: { ordineId: string; nuovoStato: StatoOrdine; ordine: Ordine }) => {
      if (data.ordineId === ordineId) {
        setOrdine(prev => prev ? { ...prev, stato: data.nuovoStato } : null)

        // Suono feedback se l'ordine è pronto
        if (data.nuovoStato === 'pronto') {
          try { new Audio('/sounds/ready.mp3').play() } catch {}
        }
      }
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe('cucina')
    }
  }, [ordineId])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-32 bg-brace-carbone rounded-2xl" />
        <div className="h-48 bg-brace-carbone rounded-2xl" />
      </div>
    )
  }

  if (!ordine) {
    return (
      <div className="text-center py-10">
        <span className="text-5xl block mb-3">❓</span>
        <p className="text-brace-testo-soft">Ordine non trovato</p>
      </div>
    )
  }

  const statoInfo = STATI[ordine.stato]
  const stepIdx = STEPS.indexOf(ordine.stato as StatoOrdine)

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Stato principale */}
      <div className={`card p-5 border-2 ${statoInfo.bg} text-center`}>
        <div className="text-5xl mb-3 animate-pulse-slow">{statoInfo.emoji}</div>
        <h2 className={`font-display text-2xl font-black ${statoInfo.colore}`}>
          {statoInfo.label}
        </h2>
        <p className="text-brace-testo-soft text-sm mt-1">
          Ordine #{ordine.numeroOrdine} • Tavolo {numeroTavolo}
        </p>
      </div>

      {/* Progress steps */}
      {ordine.stato !== 'annullato' && (
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const info = STATI[step]
            const done = i <= stepIdx
            const active = i === stepIdx
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div className="relative flex items-center w-full">
                  {i > 0 && (
                    <div className={`flex-1 h-1 ${done ? 'bg-gradient-fuoco' : 'bg-brace-fumo'} transition-all duration-500`} />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
                    transition-all duration-500 ${active ? 'shadow-fuoco scale-110' : ''}
                    ${done ? 'bg-gradient-fuoco' : 'bg-brace-carbone border-2 border-brace-fumo'}`}>
                    {done ? info.emoji : <span className="text-brace-fumo text-sm">○</span>}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 ${i < stepIdx ? 'bg-gradient-fuoco' : 'bg-brace-fumo'} transition-all duration-500`} />
                  )}
                </div>
                <span className={`text-xs mt-1.5 text-center leading-tight ${
                  done ? 'text-brace-arancio font-medium' : 'text-brace-testo-soft'
                }`}>
                  {info.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Riepilogo ordine */}
      <div className="card p-4">
        <h3 className="text-xs uppercase tracking-wider text-brace-testo-soft mb-3">
          Riepilogo ordine
        </h3>
        <div className="flex flex-col gap-2">
          {ordine.voci.map((voce, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-brace-testo">
                {voce.quantita}x {voce.nomePiatto}
              </span>
              <span className="font-mono text-brace-arancio">
                €{(voce.prezzoUnitario * voce.quantita).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t border-brace-fumo/50 pt-2 mt-1 flex justify-between font-semibold text-base">
            <span className="text-brace-testo">Totale</span>
            <span className="font-mono text-brace-crema">€{ordine.totale.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-xs text-brace-testo-soft mt-3 text-center">
          💳 Pagamento in cassa al termine della serata
        </p>
      </div>

      {/* Messaggio speciale se pronto */}
      {ordine.stato === 'pronto' && (
        <div className="card p-4 bg-green-900/20 border-green-700/50 text-center animate-bounce-in">
          <p className="text-green-300 font-semibold">
            🎉 Il tuo ordine è pronto! Il cameriere lo porterà a breve al tavolo {numeroTavolo}.
          </p>
        </div>
      )}
    </div>
  )
}
