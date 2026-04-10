'use client'
/**
 * app/admin/menu/page.tsx
 * Gestione completa del menu: categorie + piatti.
 * CRUD completo con form inline.
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Categoria { _id: string; nome: string; icona: string; ordine: number; attiva: boolean }
interface Piatto {
  _id: string; nome: string; descrizione?: string; prezzo: number
  categoria: Categoria | string; immagine?: string
  disponibile: boolean; evidenziato: boolean; ordine: number
}

const FORM_PIATTO_VUOTO = {
  nome: '', descrizione: '', prezzo: '', categoria: '',
  immagine: '', disponibile: true, evidenziato: false, ordine: 0,
}

export default function AdminMenuPage() {
  const [categorie, setCategorie] = useState<Categoria[]>([])
  const [piatti, setPiatti]       = useState<Piatto[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'piatti' | 'categorie'>('piatti')

  // Form piatto
  const [showFormPiatto, setShowFormPiatto] = useState(false)
  const [formPiatto, setFormPiatto]         = useState(FORM_PIATTO_VUOTO)
  const [editingPiatto, setEditingPiatto]   = useState<string | null>(null)
  const [salvando, setSalvando]             = useState(false)

  // Form categoria
  const [showFormCat, setShowFormCat]   = useState(false)
  const [formCat, setFormCat]           = useState({ nome: '', icona: '🍽️', ordine: 0, attiva: true })
  const [editingCat, setEditingCat]     = useState<string | null>(null)

  useEffect(() => { carica() }, [])

  const carica = async () => {
    const [p, c] = await Promise.all([
      fetch('/api/menu').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ])
    setPiatti(p)
    setCategorie(c)
    setLoading(false)
  }

  // ---- PIATTI ----
  const salvaPiatto = async () => {
    if (!formPiatto.nome || !formPiatto.prezzo || !formPiatto.categoria) {
      toast.error('Compila nome, prezzo e categoria')
      return
    }
    setSalvando(true)
    const body = { ...formPiatto, prezzo: parseFloat(formPiatto.prezzo) }
    try {
      const res = editingPiatto
        ? await fetch(`/api/menu/${editingPiatto}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editingPiatto ? 'Piatto aggiornato' : 'Piatto aggiunto')
        setShowFormPiatto(false)
        setEditingPiatto(null)
        setFormPiatto(FORM_PIATTO_VUOTO)
        carica()
      } else {
        toast.error('Errore salvataggio')
      }
    } finally { setSalvando(false) }
  }

  const eliminaPiatto = async (id: string, nome: string) => {
    if (!confirm(`Eliminare "${nome}"?`)) return
    const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Eliminato'); carica() }
  }

  const toggleDisponibilita = async (p: Piatto) => {
    await fetch(`/api/menu/${p._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponibile: !p.disponibile }),
    })
    setPiatti(prev => prev.map(x => x._id === p._id ? { ...x, disponibile: !x.disponibile } : x))
  }

  const apriModificaPiatto = (p: Piatto) => {
    const catId = typeof p.categoria === 'object' ? p.categoria._id : p.categoria
    setFormPiatto({ ...p, prezzo: String(p.prezzo), categoria: catId, immagine: p.immagine ?? '' })
    setEditingPiatto(p._id)
    setShowFormPiatto(true)
  }

  // ---- CATEGORIE ----
  const salvaCategoria = async () => {
    if (!formCat.nome) { toast.error('Inserisci il nome'); return }
    const res = editingCat
      ? await fetch(`/api/categories/${editingCat}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formCat) })
      : await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formCat) })
    if (res.ok) {
      toast.success(editingCat ? 'Categoria aggiornata' : 'Categoria aggiunta')
      setShowFormCat(false)
      setEditingCat(null)
      setFormCat({ nome: '', icona: '🍽️', ordine: 0, attiva: true })
      carica()
    }
  }

  const eliminaCategoria = async (id: string, nome: string) => {
    if (!confirm(`Eliminare la categoria "${nome}"? I piatti associati rimarranno senza categoria.`)) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    toast.success('Categoria eliminata')
    carica()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><span className="text-4xl animate-pulse">🍽️</span></div>
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-black text-brace-crema">Gestione Menu</h1>
        <button
          onClick={() => { setShowFormPiatto(true); setEditingPiatto(null); setFormPiatto(FORM_PIATTO_VUOTO) }}
          className="btn-primary px-4 py-2.5 text-sm"
        >
          + Nuovo Piatto
        </button>
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {['piatti', 'categorie'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-gradient-fuoco text-white shadow-fuoco' : 'bg-brace-carbone text-brace-testo-soft border border-brace-fumo'
            }`}>
            {t === 'piatti' ? `🍽️ Piatti (${piatti.length})` : `📂 Categorie (${categorie.length})`}
          </button>
        ))}
      </div>

      {/* ---- FORM PIATTO ---- */}
      {showFormPiatto && (
        <div className="card p-5 border-brace-arancio/50">
          <h2 className="font-display text-lg font-bold text-brace-crema mb-4">
            {editingPiatto ? '✏️ Modifica Piatto' : '+ Nuovo Piatto'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome *</label>
              <input className="input" value={formPiatto.nome} onChange={e => setFormPiatto(p => ({...p, nome: e.target.value}))} placeholder="Es: Bombette Pugliesi" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrizione</label>
              <textarea className="input resize-none" rows={2} value={formPiatto.descrizione} onChange={e => setFormPiatto(p => ({...p, descrizione: e.target.value}))} placeholder="Descrizione del piatto..." />
            </div>
            <div>
              <label className="label">Prezzo (€) *</label>
              <input className="input" type="number" step="0.50" min="0" value={formPiatto.prezzo} onChange={e => setFormPiatto(p => ({...p, prezzo: e.target.value}))} placeholder="12.50" />
            </div>
            <div>
              <label className="label">Categoria *</label>
              <select className="input" value={formPiatto.categoria} onChange={e => setFormPiatto(p => ({...p, categoria: e.target.value}))}>
                <option value="">Seleziona...</option>
                {categorie.map(c => <option key={c._id} value={c._id}>{c.icona} {c.nome}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">URL Immagine (opzionale)</label>
              <input className="input" value={formPiatto.immagine} onChange={e => setFormPiatto(p => ({...p, immagine: e.target.value}))} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Ordine di visualizzazione</label>
              <input className="input" type="number" min="0" value={formPiatto.ordine} onChange={e => setFormPiatto(p => ({...p, ordine: parseInt(e.target.value)}))} />
            </div>
            <div className="flex flex-col gap-3 justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formPiatto.disponibile} onChange={e => setFormPiatto(p => ({...p, disponibile: e.target.checked}))} className="w-4 h-4 accent-orange-500" />
                <span className="text-brace-testo text-sm">Disponibile</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formPiatto.evidenziato} onChange={e => setFormPiatto(p => ({...p, evidenziato: e.target.checked}))} className="w-4 h-4 accent-orange-500" />
                <span className="text-brace-testo text-sm">⭐ Evidenziato</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={salvaPiatto} disabled={salvando} className="btn-primary px-6 py-2.5">
              {salvando ? 'Salvataggio...' : editingPiatto ? 'Aggiorna' : 'Aggiungi'}
            </button>
            <button onClick={() => { setShowFormPiatto(false); setEditingPiatto(null) }} className="btn-ghost px-5 py-2.5">Annulla</button>
          </div>
        </div>
      )}

      {/* ---- LISTA PIATTI ---- */}
      {tab === 'piatti' && (
        <div className="flex flex-col gap-2">
          {categorie.map(cat => {
            const piattiCat = piatti.filter(p => {
              const cid = typeof p.categoria === 'object' ? p.categoria._id : p.categoria
              return cid === cat._id
            })
            if (piattiCat.length === 0) return null
            return (
              <div key={cat._id}>
                <h3 className="font-display text-base font-bold text-brace-testo-soft mb-2 px-1">
                  {cat.icona} {cat.nome}
                </h3>
                {piattiCat.map(p => (
                  <div key={p._id} className="card p-4 flex items-center gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${p.disponibile ? 'text-brace-testo' : 'text-brace-testo-soft line-through'}`}>
                          {p.evidenziato && '⭐ '}{p.nome}
                        </span>
                        {!p.disponibile && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-900/40 text-red-400 rounded-full border border-red-800/50">off</span>
                        )}
                      </div>
                      <span className="text-brace-arancio font-mono text-sm">€{p.prezzo.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleDisponibilita(p)} title={p.disponibile ? 'Disabilita' : 'Abilita'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all ${p.disponibile ? 'border-green-700/50 text-green-400 hover:bg-green-900/30' : 'border-brace-fumo text-brace-testo-soft hover:bg-brace-fumo'}`}>
                        {p.disponibile ? '✓' : '○'}
                      </button>
                      <button onClick={() => apriModificaPiatto(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-brace-fumo hover:bg-brace-fumo/80 text-brace-testo transition-all">✏️</button>
                      <button onClick={() => eliminaPiatto(p._id, p.nome)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-all">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ---- CATEGORIE ---- */}
      {tab === 'categorie' && (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setShowFormCat(true); setEditingCat(null); setFormCat({ nome: '', icona: '🍽️', ordine: 0, attiva: true }) }}
            className="btn-secondary w-fit px-4 py-2.5 text-sm">
            + Nuova Categoria
          </button>
          {showFormCat && (
            <div className="card p-4 border-brace-arancio/40">
              <h3 className="font-semibold text-brace-testo mb-3">{editingCat ? 'Modifica Categoria' : 'Nuova Categoria'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Nome *</label>
                  <input className="input" value={formCat.nome} onChange={e => setFormCat(p => ({...p, nome: e.target.value}))} placeholder="Es: Antipasti" />
                </div>
                <div>
                  <label className="label">Icona (emoji)</label>
                  <input className="input" value={formCat.icona} onChange={e => setFormCat(p => ({...p, icona: e.target.value}))} placeholder="🍽️" />
                </div>
                <div>
                  <label className="label">Ordine</label>
                  <input className="input" type="number" value={formCat.ordine} onChange={e => setFormCat(p => ({...p, ordine: parseInt(e.target.value)}))} />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={salvaCategoria} className="btn-primary px-5 py-2">Salva</button>
                <button onClick={() => { setShowFormCat(false); setEditingCat(null) }} className="btn-ghost px-4 py-2">Annulla</button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {categorie.map(cat => (
              <div key={cat._id} className="card p-4 flex items-center gap-3">
                <span className="text-2xl">{cat.icona}</span>
                <div className="flex-1">
                  <p className="font-semibold text-brace-testo">{cat.nome}</p>
                  <p className="text-brace-testo-soft text-xs">ordine: {cat.ordine}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setFormCat({ nome: cat.nome, icona: cat.icona, ordine: cat.ordine, attiva: cat.attiva }); setEditingCat(cat._id); setShowFormCat(true) }}
                    className="w-8 h-8 rounded-lg bg-brace-fumo flex items-center justify-center text-sm">✏️</button>
                  <button onClick={() => eliminaCategoria(cat._id, cat.nome)}
                    className="w-8 h-8 rounded-lg bg-red-900/30 text-red-400 flex items-center justify-center text-sm">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
