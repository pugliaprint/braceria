'use client'
/**
 * app/admin/prenotazioni/page.tsx
 * Gestione prenotazioni con filtri per data e stato.
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface Prenotazione {
  _id: string; nome: string; telefono: string
  data: string; fasciaOraria: string; numerPersone: number
  note?: string; stato: 'confermata' | 'cancellata' | 'completata'
  createdAt: string
}

export default function AdminPrenotazioniPage() {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([])
  const [loading, setLoading]           = useState(true)
  const [dataFiltro, setDataFiltro]     = useState(new Date().toISOString().split('T')[0])
  const [statoFiltro, setStatoFiltro]   = useState('')

  const carica = async () => {
    setLoading(true)
    let url = '/api/reservations?'
    if (dataFiltro) url += `data=${dataFiltro}&`
    if (statoFiltro) url += `stato=${statoFiltro}`
    const data = await fetch(url).then(r => r.json())
    setPrenotazioni(data)
    setLoading(false)
  }

  useEffect(() => { carica() }, [dataFiltro, statoFiltro])

  const cambiaStato = async (id: string, stato: string) => {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato }),
    })
    if (res.ok) { toast.success('Aggiornato'); carica() }
    else toast.error('Errore')
  }

  const elimina = async (id: string, nome: string) => {
    if (!confirm(`Cancellare la prenotazione di ${nome}?`)) return
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    toast.success('Prenotazione cancellata')
    carica()
  }

  // Raggruppa per fascia oraria
  const perFascia = prenotazioni.reduce<Record<string, Prenotazione[]>>((acc, p) => {
    if (!acc[p.fasciaOraria]) acc[p.fasciaOraria] = []
    acc[p.fasciaOraria].push(p)
    return acc
  }, {})

  const totalePersone = prenotazioni
    .filter(p => p.stato === 'confermata')
    .reduce((acc, p) => acc + p.numerPersone, 0)

  const STATO_CONFIG: Record<string, { label: string; cls: string }> = {
    confermata:  { label: 'Confermata',  cls: 'text-green-400 bg-green-900/30 border-green-700/50' },
    cancellata:  { label: 'Cancellata',  cls: 'text-red-400 bg-red-900/30 border-red-700/50' },
    completata:  { label: 'Completata',  cls: 'text-blue-400 bg-blue-900/30 border-blue-700/50' },
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <h1 className="font-display text-2xl font-black text-brace-crema">Prenotazioni</h1>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="label text-xs">Data</label>
          <input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} className="input py-2" />
        </div>
        <div>
          <label className="label text-xs">Stato</label>
          <select value={statoFiltro} onChange={e => setStatoFiltro(e.target.value)} className="input py-2">
            <option value="">Tutti</option>
            <option value="confermata">Confermata</option>
            <option value="cancellata">Cancellata</option>
            <option value="completata">Completata</option>
          </select>
        </div>
      </div>

      {/* Sommario giornata */}
      {dataFiltro && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-brace-testo font-semibold capitalize">
              {format(parseISO(dataFiltro), 'EEEE d MMMM', { locale: it })}
            </p>
            <p className="text-brace-testo-soft text-sm">
              {prenotazioni.filter(p => p.stato === 'confermata').length} prenotazioni confermate
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-black text-gradient-fuoco">{totalePersone}</p>
            <p className="text-brace-testo-soft text-xs">persone totali</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><span className="text-4xl animate-pulse">📅</span></div>
      ) : prenotazioni.length === 0 ? (
        <div className="text-center py-16 text-brace-testo-soft">
          <span className="text-5xl block mb-3">📅</span>
          <p>Nessuna prenotazione per questa data</p>
        </div>
      ) : (
        /* Lista per fascia oraria */
        Object.entries(perFascia).sort().map(([fascia, pren]) => (
          <div key={fascia}>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-display text-xl font-bold text-brace-arancio">{fascia}</span>
              <span className="text-brace-testo-soft text-sm">
                {pren.filter(p => p.stato === 'confermata').reduce((a, p) => a + p.numerPersone, 0)} persone
              </span>
              <div className="flex-1 h-px bg-brace-fumo/50" />
            </div>
            <div className="flex flex-col gap-2">
              {pren.map(p => {
                const sc = STATO_CONFIG[p.stato]
                return (
                  <div key={p._id} className="card p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-brace-testo">{p.nome}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-sm text-brace-testo-soft flex-wrap">
                        <span>📞 {p.telefono}</span>
                        <span>👥 {p.numerPersone} persone</span>
                        {p.note && <span className="text-yellow-400">📝 {p.note}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {p.stato === 'confermata' && (
                        <>
                          <button onClick={() => cambiaStato(p._id, 'completata')}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-blue-900/40 text-blue-400 border border-blue-700/50 hover:bg-blue-900/60">
                            ✓ Completata
                          </button>
                          <button onClick={() => cambiaStato(p._id, 'cancellata')}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-red-900/40 text-red-400 border border-red-700/50 hover:bg-red-900/60">
                            ✗ Cancella
                          </button>
                        </>
                      )}
                      <button onClick={() => elimina(p._id, p.nome)}
                        className="w-8 h-8 rounded-lg bg-red-900/20 text-red-400 flex items-center justify-center text-sm hover:bg-red-900/40">
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
