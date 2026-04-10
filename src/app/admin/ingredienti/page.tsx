'use client'
/**
 * app/admin/ingredienti/page.tsx
 * Gestione ingredienti panino builder: categorie + ingredienti.
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface IngCat { _id: string; nome: string; icona: string; ordine: number; sceltaMinima: number; sceltaMassima: number; attiva: boolean }
interface Ing { _id: string; nome: string; categoria: IngCat | string; prezzoExtra: number; disponibile: boolean; ordine: number }

export default function AdminIngredientiPage() {
  const [cats, setCats]         = useState<IngCat[]>([])
  const [ings, setIngs]         = useState<Ing[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'ingredienti' | 'categorie'>('ingredienti')

  // Form ingrediente
  const [showFormIng, setShowFormIng]   = useState(false)
  const [formIng, setFormIng]           = useState({ nome: '', categoria: '', prezzoExtra: '0', disponibile: true, ordine: 0 })
  const [editingIng, setEditingIng]     = useState<string | null>(null)

  // Form categoria ing
  const [showFormCat, setShowFormCat]   = useState(false)
  const [formCat, setFormCat]           = useState({ nome: '', icona: '🧅', ordine: 0, sceltaMinima: 0, sceltaMassima: 5, attiva: true })
  const [editingCat, setEditingCat]     = useState<string | null>(null)

  useEffect(() => { carica() }, [])

  const carica = async () => {
    const [c, i] = await Promise.all([
      fetch('/api/ingredients?tipo=categorie').then(r => r.json()),
      fetch('/api/ingredients').then(r => r.json()),
    ])
    setCats(c)
    setIngs(i)
    setLoading(false)
  }

  const salvaIng = async () => {
    if (!formIng.nome || !formIng.categoria) { toast.error('Nome e categoria obbligatori'); return }
    const body = { ...formIng, prezzoExtra: parseFloat(formIng.prezzoExtra) }
    const res = editingIng
      ? await fetch(`/api/ingredients/${editingIng}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { toast.success('Salvato'); setShowFormIng(false); setEditingIng(null); setFormIng({ nome: '', categoria: '', prezzoExtra: '0', disponibile: true, ordine: 0 }); carica() }
    else toast.error('Errore salvataggio')
  }

  const eliminaIng = async (id: string) => {
    if (!confirm('Eliminare questo ingrediente?')) return
    await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
    toast.success('Eliminato'); carica()
  }

  const toggleDispIng = async (ing: Ing) => {
    await fetch(`/api/ingredients/${ing._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disponibile: !ing.disponibile }) })
    setIngs(prev => prev.map(i => i._id === ing._id ? { ...i, disponibile: !i.disponibile } : i))
  }

  const salvaCat = async () => {
    if (!formCat.nome) { toast.error('Nome obbligatorio'); return }
    const body = { tipo: 'categoria', ...formCat }
    const res = editingCat
      ? await fetch(`/api/ingredients/${editingCat}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { toast.success('Categoria salvata'); setShowFormCat(false); setEditingCat(null); carica() }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><span className="text-4xl animate-pulse">🧅</span></div>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-black text-brace-crema">Panino Builder</h1>
        <button onClick={() => { setShowFormIng(true); setEditingIng(null) }} className="btn-primary px-4 py-2.5 text-sm">+ Ingrediente</button>
      </div>

      <div className="flex gap-2">
        {['ingredienti', 'categorie'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-gradient-fuoco text-white shadow-fuoco' : 'bg-brace-carbone text-brace-testo-soft border border-brace-fumo'
            }`}>
            {t === 'ingredienti' ? `🧅 Ingredienti (${ings.length})` : `📂 Categorie (${cats.length})`}
          </button>
        ))}
      </div>

      {/* Form ingrediente */}
      {showFormIng && (
        <div className="card p-5 border-brace-arancio/40">
          <h2 className="font-display text-lg font-bold text-brace-crema mb-4">{editingIng ? 'Modifica' : 'Nuovo'} Ingrediente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Nome *</label>
              <input className="input" value={formIng.nome} onChange={e => setFormIng(p => ({...p, nome: e.target.value}))} placeholder="Es: Provola Affumicata" />
            </div>
            <div>
              <label className="label">Categoria *</label>
              <select className="input" value={formIng.categoria} onChange={e => setFormIng(p => ({...p, categoria: e.target.value}))}>
                <option value="">Seleziona...</option>
                {cats.map(c => <option key={c._id} value={c._id}>{c.icona} {c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prezzo Extra (€)</label>
              <input className="input" type="number" step="0.50" min="0" value={formIng.prezzoExtra} onChange={e => setFormIng(p => ({...p, prezzoExtra: e.target.value}))} />
            </div>
            <div>
              <label className="label">Ordine</label>
              <input className="input" type="number" min="0" value={formIng.ordine} onChange={e => setFormIng(p => ({...p, ordine: parseInt(e.target.value)}))} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formIng.disponibile} onChange={e => setFormIng(p => ({...p, disponibile: e.target.checked}))} className="w-4 h-4 accent-orange-500" />
                <span className="text-brace-testo text-sm">Disponibile</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={salvaIng} className="btn-primary px-6 py-2.5">Salva</button>
            <button onClick={() => { setShowFormIng(false); setEditingIng(null) }} className="btn-ghost px-4 py-2.5">Annulla</button>
          </div>
        </div>
      )}

      {/* Lista ingredienti */}
      {tab === 'ingredienti' && (
        <div className="flex flex-col gap-2">
          {cats.map(cat => {
            const ingsCat = ings.filter(i => {
              const cid = typeof i.categoria === 'object' ? (i.categoria as IngCat)._id : i.categoria
              return cid === cat._id
            })
            if (ingsCat.length === 0) return null
            return (
              <div key={cat._id} className="mb-3">
                <h3 className="font-display text-sm font-bold text-brace-testo-soft mb-1.5 px-1">
                  {cat.icona} {cat.nome} <span className="opacity-60 font-normal">(min {cat.sceltaMinima} / max {cat.sceltaMassima})</span>
                </h3>
                {ingsCat.map(ing => (
                  <div key={ing._id} className="card p-3.5 flex items-center gap-3 mb-1.5">
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${ing.disponibile ? 'text-brace-testo' : 'text-brace-testo-soft line-through'}`}>{ing.nome}</span>
                      {ing.prezzoExtra > 0 && <span className="text-brace-arancio font-mono text-xs ml-2">+€{ing.prezzoExtra.toFixed(2)}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDispIng(ing)}
                        className={`w-7 h-7 rounded-lg text-xs border flex items-center justify-center ${ing.disponibile ? 'border-green-700/50 text-green-400' : 'border-brace-fumo text-brace-testo-soft'}`}>
                        {ing.disponibile ? '✓' : '○'}
                      </button>
                      <button onClick={() => {
                        const cid = typeof ing.categoria === 'object' ? (ing.categoria as IngCat)._id : ing.categoria
                        setFormIng({ nome: ing.nome, categoria: cid, prezzoExtra: String(ing.prezzoExtra), disponibile: ing.disponibile, ordine: ing.ordine })
                        setEditingIng(ing._id); setShowFormIng(true)
                      }} className="w-7 h-7 rounded-lg bg-brace-fumo text-xs flex items-center justify-center">✏️</button>
                      <button onClick={() => eliminaIng(ing._id)} className="w-7 h-7 rounded-lg bg-red-900/30 text-red-400 text-xs flex items-center justify-center">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Lista categorie */}
      {tab === 'categorie' && (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setShowFormCat(true); setEditingCat(null); setFormCat({ nome: '', icona: '🧅', ordine: 0, sceltaMinima: 0, sceltaMassima: 5, attiva: true }) }}
            className="btn-secondary w-fit px-4 py-2 text-sm">
            + Nuova Categoria
          </button>
          {showFormCat && (
            <div className="card p-4 border-brace-arancio/40">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nome *</label><input className="input" value={formCat.nome} onChange={e => setFormCat(p => ({...p, nome: e.target.value}))} placeholder="Es: Carne" /></div>
                <div><label className="label">Icona</label><input className="input" value={formCat.icona} onChange={e => setFormCat(p => ({...p, icona: e.target.value}))} /></div>
                <div><label className="label">Min scelte</label><input className="input" type="number" min="0" value={formCat.sceltaMinima} onChange={e => setFormCat(p => ({...p, sceltaMinima: parseInt(e.target.value)}))} /></div>
                <div><label className="label">Max scelte</label><input className="input" type="number" min="1" value={formCat.sceltaMassima} onChange={e => setFormCat(p => ({...p, sceltaMassima: parseInt(e.target.value)}))} /></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={salvaCat} className="btn-primary px-5 py-2">Salva</button>
                <button onClick={() => { setShowFormCat(false); setEditingCat(null) }} className="btn-ghost px-4 py-2">Annulla</button>
              </div>
            </div>
          )}
          {cats.map(cat => (
            <div key={cat._id} className="card p-4 flex items-center gap-3">
              <span className="text-2xl">{cat.icona}</span>
              <div className="flex-1">
                <p className="font-semibold text-brace-testo">{cat.nome}</p>
                <p className="text-brace-testo-soft text-xs">min {cat.sceltaMinima} · max {cat.sceltaMassima} · ordine {cat.ordine}</p>
              </div>
              <button onClick={() => { setFormCat({ nome: cat.nome, icona: cat.icona, ordine: cat.ordine, sceltaMinima: cat.sceltaMinima, sceltaMassima: cat.sceltaMassima, attiva: cat.attiva }); setEditingCat(cat._id); setShowFormCat(true) }}
                className="w-8 h-8 rounded-lg bg-brace-fumo flex items-center justify-center">✏️</button>
              <button onClick={async () => { await fetch(`/api/ingredients/${cat._id}?tipo=categoria`, { method: 'DELETE' }); carica() }}
                className="w-8 h-8 rounded-lg bg-red-900/30 text-red-400 flex items-center justify-center">🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
