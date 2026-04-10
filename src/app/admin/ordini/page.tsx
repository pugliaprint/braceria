'use client'
/**
 * app/admin/ordini/page.tsx
 * Storico e gestione ordini con filtri.
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface VoceOrdine { nomePiatto: string; quantita: number; prezzoUnitario: number; ingredienti?: any[] }
interface Ordine {
  _id: string; numeroOrdine: number; tipo: 'tavolo' | 'delivery'; stato: string
  numeroTavolo?: number; nomeCliente?: string; indirizzo?: string
  voci: VoceOrdine[]; totale: number; note?: string; createdAt: string
}

const STATI = ['nuovo','in_preparazione','pronto','consegnato','annullato']
const STATI_LABEL: Record<string, string> = {
  nuovo: '🔴 Nuovo', in_preparazione: '🟡 In prep.', pronto: '🟢 Pronto',
  consegnato: '✅ Consegnato', annullato: '❌ Annullato',
}
const STATI_CLS: Record<string, string> = {
  nuovo: 'text-red-300 bg-red-900/30 border-red-700/50',
  in_preparazione: 'text-yellow-300 bg-yellow-900/30 border-yellow-700/50',
  pronto: 'text-green-300 bg-green-900/30 border-green-700/50',
  consegnato: 'text-blue-300 bg-blue-900/30 border-blue-700/50',
  annullato: 'text-gray-400 bg-gray-900/30 border-gray-700/50',
}

export default function AdminOrdiniPage() {
  const [ordini, setOrdini]         = useState<Ordine[]>([])
  const [loading, setLoading]       = useState(true)
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0])
  const [statoFiltro, setStatoFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro]   = useState('')
  const [dettaglio, setDettaglio]     = useState<string | null>(null)

  const carica = async () => {
    setLoading(true)
    let url = '/api/orders?limit=200'
    if (dataFiltro) url += `&data=${dataFiltro}`
    if (statoFiltro) url += `&stato=${statoFiltro}`
    if (tipoFiltro) url += `&tipo=${tipoFiltro}`
    const data = await fetch(url).then(r => r.json())
    setOrdini(data)
    setLoading(false)
  }

  useEffect(() => { carica() }, [dataFiltro, statoFiltro, tipoFiltro])

  const cambiaStato = async (id: string, stato: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato }),
    })
    if (res.ok) { toast.success('Stato aggiornato'); carica() }
    else toast.error('Errore')
  }

  const totaleGiornata = ordini
    .filter(o => o.stato !== 'annullato')
    .reduce((acc, o) => acc + o.totale, 0)

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <h1 className="font-display text-2xl font-black text-brace-crema">Ordini</h1>

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
            {STATI.map(s => <option key={s} value={s}>{STATI_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Tipo</label>
          <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="input py-2">
            <option value="">Tutti</option>
            <option value="tavolo">🍽️ Tavolo</option>
            <option value="delivery">🛵 Delivery</option>
          </select>
        </div>
      </div>

      {/* Totale giornata */}
      <div className="card p-4 flex justify-between items-center">
        <div>
          <p className="text-brace-testo-soft text-sm">{ordini.length} ordini trovati</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-black text-gradient-fuoco">€{totaleGiornata.toFixed(2)}</p>
          <p className="text-brace-testo-soft text-xs">incasso totale</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="text-4xl animate-pulse">📦</span></div>
      ) : ordini.length === 0 ? (
        <div className="text-center py-16 text-brace-testo-soft">
          <span className="text-5xl block mb-3">📦</span>
          <p>Nessun ordine trovato</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ordini.map(ordine => (
            <div key={ordine._id} className="card overflow-hidden">
              {/* Header ordine */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-brace-fumo/20 transition-colors"
                onClick={() => setDettaglio(dettaglio === ordine._id ? null : ordine._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-lg font-bold text-brace-crema">
                      #{ordine.numeroOrdine}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATI_CLS[ordine.stato]}`}>
                      {STATI_LABEL[ordine.stato]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brace-fumo text-brace-testo-soft">
                      {ordine.tipo === 'tavolo' ? `🍽️ Tavolo ${ordine.numeroTavolo}` : `🛵 ${ordine.nomeCliente}`}
                    </span>
                  </div>
                  <p className="text-brace-testo-soft text-xs mt-0.5">
                    {new Date(ordine.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    {' '}• {ordine.voci.length} articoli
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-semibold text-brace-arancio">€{ordine.totale.toFixed(2)}</p>
                  <p className="text-brace-testo-soft text-xs">{dettaglio === ordine._id ? '▲' : '▼'}</p>
                </div>
              </div>

              {/* Dettaglio espandibile */}
              {dettaglio === ordine._id && (
                <div className="border-t border-brace-fumo/50 p-4 flex flex-col gap-3">
                  {/* Voci */}
                  <div className="flex flex-col gap-1.5">
                    {ordine.voci.map((v, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-brace-testo">
                          {v.quantita}× {v.nomePiatto}
                          {v.ingredienti && v.ingredienti.length > 0 && (
                            <span className="text-brace-testo-soft ml-1 text-xs">
                              ({v.ingredienti.map((i: any) => i.nomeIngrediente).join(', ')})
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-brace-arancio">€{(v.prezzoUnitario * v.quantita).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {ordine.indirizzo && (
                    <p className="text-sm text-brace-testo-soft">📍 {ordine.indirizzo}</p>
                  )}
                  {ordine.note && (
                    <p className="text-sm text-yellow-400">📝 {ordine.note}</p>
                  )}
                  {/* Cambio stato */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-brace-fumo/30">
                    {STATI.filter(s => s !== ordine.stato).map(s => (
                      <button key={s} onClick={() => cambiaStato(ordine._id, s)}
                        className="px-3 py-1.5 rounded-lg text-xs border border-brace-fumo text-brace-testo-soft hover:border-brace-arancio hover:text-brace-arancio transition-colors">
                        → {STATI_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
