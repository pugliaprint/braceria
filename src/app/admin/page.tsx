'use client'
/**
 * app/admin/page.tsx
 * Dashboard admin principale con statistiche e accesso rapido.
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  ordiniOggi: number
  ordiniNuovi: number
  prenotazioniOggi: number
  deliveryAttivo: boolean
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const oggi = new Date().toISOString().split('T')[0]
    Promise.all([
      fetch(`/api/orders?data=${oggi}&limit=200`).then(r => r.json()),
      fetch(`/api/reservations?data=${oggi}`).then(r => r.json()),
      fetch('/api/settings?pubblico=true').then(r => r.json()),
    ]).then(([ordini, prenotazioni, settings]) => {
      setStats({
        ordiniOggi: ordini.length,
        ordiniNuovi: ordini.filter((o: any) => o.stato === 'nuovo').length,
        prenotazioniOggi: prenotazioni.filter((p: any) => p.stato === 'confermata').length,
        deliveryAttivo: settings.deliveryAttivo ?? true,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleDelivery = async () => {
    if (!stats) return
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryAttivo: !stats.deliveryAttivo }),
    })
    if (res.ok) setStats(s => s ? { ...s, deliveryAttivo: !s.deliveryAttivo } : s)
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-black text-brace-crema">Dashboard</h1>
        <p className="text-brace-testo-soft text-sm mt-0.5">
          {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ordini oggi',     value: stats?.ordiniOggi ?? '—',       emoji: '📦', colore: 'text-brace-arancio' },
          { label: 'Nuovi ordini',    value: stats?.ordiniNuovi ?? '—',      emoji: '🔴', colore: 'text-red-400' },
          { label: 'Prenotazioni',    value: stats?.prenotazioniOggi ?? '—', emoji: '📅', colore: 'text-blue-400' },
          { label: 'Delivery',
            value: loading ? '—' : stats?.deliveryAttivo ? 'Attivo' : 'Spento',
            emoji: '🛵',
            colore: stats?.deliveryAttivo ? 'text-green-400' : 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="card p-4 flex flex-col gap-1">
            <span className="text-2xl">{s.emoji}</span>
            <span className={`font-display text-3xl font-black ${s.colore}`}>{s.value}</span>
            <span className="text-brace-testo-soft text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Controllo rapido delivery */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-brace-testo">🛵 Servizio Delivery</h2>
          <p className="text-brace-testo-soft text-sm mt-0.5">
            {stats?.deliveryAttivo ? 'Attivo — i clienti possono ordinare' : 'Sospeso — ordini disabilitati'}
          </p>
        </div>
        <button
          onClick={toggleDelivery}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
            stats?.deliveryAttivo ? 'bg-green-600' : 'bg-brace-fumo'
          }`}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300 ${
            stats?.deliveryAttivo ? 'left-7' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Accessi rapidi */}
      <div>
        <h2 className="font-display text-lg font-bold text-brace-crema mb-3">Accesso Rapido</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/ordini',       label: 'Vedi Ordini',       emoji: '📦' },
            { href: '/admin/prenotazioni', label: 'Prenotazioni',      emoji: '📅' },
            { href: '/admin/menu',         label: 'Gestisci Menu',     emoji: '🍽️' },
            { href: '/cucina',             label: 'Apri Cucina',       emoji: '🍳', target: '_blank' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              target={(link as any).target}
              className="card p-4 flex flex-col items-center gap-2 text-center
                         hover:border-brace-arancio/50 active:scale-95 transition-all"
            >
              <span className="text-3xl">{link.emoji}</span>
              <span className="text-brace-testo text-sm font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
