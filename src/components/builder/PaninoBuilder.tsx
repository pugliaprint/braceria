'use client'
/**
 * components/builder/PaninoBuilder.tsx
 * Componente interattivo per costruire il panino personalizzato.
 * Mostra le categorie ingredienti una alla volta (step-by-step) o
 * tutte insieme in modalità scroll.
 * Calcola il prezzo dinamicamente.
 */
import { useState, useEffect } from 'react'
import { useCart, CartIngrediente } from '@/components/providers/CartProvider'
import toast from 'react-hot-toast'

interface Ingrediente {
  _id: string
  nome: string
  prezzoExtra: number
  disponibile: boolean
  ordine: number
}

interface CategoriaIngrediente {
  _id: string
  nome: string
  icona: string
  ordine: number
  sceltaMinima: number
  sceltaMassima: number
  ingredienti: Ingrediente[]
}

const PREZZO_BASE = 6.00

interface PaninoBuilderProps {
  onComplete?: () => void   // callback dopo aggiunta al carrello
  compact?: boolean         // modalità compatta (dentro pagina ordine)
}

export default function PaninoBuilder({ onComplete, compact }: PaninoBuilderProps) {
  const { addItem } = useCart()

  const [categorie, setCategorie] = useState<CategoriaIngrediente[]>([])
  const [loading, setLoading] = useState(true)
  // Map: categoriaId → array di ingredientiId selezionati
  const [selezioni, setSelezioni] = useState<Record<string, string[]>>({})
  const [note, setNote] = useState('')
  const [aggiunta, setAggiunta] = useState(false)

  useEffect(() => {
    // Carica ingredienti con categorie
    Promise.all([
      fetch('/api/ingredients?tipo=categorie').then(r => r.json()),
      fetch('/api/ingredients?disponibili=true').then(r => r.json()),
    ]).then(([cats, ings]) => {
      // Raggruppa ingredienti per categoria
      const catsConIng: CategoriaIngrediente[] = cats.map((cat: any) => ({
        ...cat,
        ingredienti: ings.filter((ing: any) => ing.categoria?._id === cat._id || ing.categoria === cat._id),
      }))
      setCategorie(catsConIng.filter(c => c.ingredienti.length > 0))
    }).catch(() => toast.error('Errore caricamento ingredienti'))
      .finally(() => setLoading(false))
  }, [])

  // Calcola prezzo totale dinamico
  const prezzoTotale = (() => {
    let totale = PREZZO_BASE
    Object.values(selezioni).flat().forEach(ingId => {
      categorie.forEach(cat => {
        const ing = cat.ingredienti.find(i => i._id === ingId)
        if (ing) totale += ing.prezzoExtra
      })
    })
    return totale
  })()

  // Toggle selezione ingrediente
  const toggleIngrediente = (catId: string, ingId: string, sceltaMassima: number) => {
    setSelezioni(prev => {
      const correnti = prev[catId] ?? []
      if (correnti.includes(ingId)) {
        return { ...prev, [catId]: correnti.filter(id => id !== ingId) }
      }
      if (correnti.length >= sceltaMassima) {
        if (sceltaMassima === 1) {
          // Singola scelta: sostituisce
          return { ...prev, [catId]: [ingId] }
        }
        toast.error(`Puoi scegliere max ${sceltaMassima} ingredienti in questa categoria`)
        return prev
      }
      return { ...prev, [catId]: [...correnti, ingId] }
    })
  }

  // Valida che le categorie obbligatorie siano soddisfatte
  const valida = (): string | null => {
    for (const cat of categorie) {
      const selezionati = (selezioni[cat._id] ?? []).length
      if (selezionati < cat.sceltaMinima) {
        return `Seleziona almeno ${cat.sceltaMinima} opzione in "${cat.nome}"`
      }
    }
    return null
  }

  // Aggiungi al carrello
  const aggiungiAlCarrello = () => {
    const errore = valida()
    if (errore) { toast.error(errore); return }

    // Costruisci lista ingredienti selezionati
    const ingredientiSelezionati: CartIngrediente[] = []
    Object.entries(selezioni).forEach(([catId, ingIds]) => {
      const cat = categorie.find(c => c._id === catId)
      if (!cat) return
      ingIds.forEach(ingId => {
        const ing = cat.ingredienti.find(i => i._id === ingId)
        if (!ing) return
        ingredientiSelezionati.push({
          ingredienteId: ing._id,
          nomeIngrediente: ing.nome,
          categoria: cat.nome,
          prezzoExtra: ing.prezzoExtra,
        })
      })
    })

    // Genera nome leggibile dal panino
    const carneSel = ingredientiSelezionati
      .filter(i => i.categoria === 'Carne')
      .map(i => i.nomeIngrediente)
      .join(' + ')
    const nomePanino = carneSel
      ? `Panino con ${carneSel}`
      : 'Panino Personalizzato'

    // ID univoco (evita collisioni tra più panini nel carrello)
    const id = `panino_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    addItem({
      id,
      tipo: 'panino_personalizzato',
      nomePiatto: nomePanino,
      prezzoUnitario: prezzoTotale,
      quantita: 1,
      ingredienti: ingredientiSelezionati,
      note: note.trim() || undefined,
    })

    setAggiunta(true)
    toast.success(`🥪 ${nomePanino} aggiunto al carrello!`)
    setTimeout(() => {
      setAggiunta(false)
      setSelezioni({})
      setNote('')
      onComplete?.()
    }, 1200)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-brace-carbone rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Intestazione builder */}
      {!compact && (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-fuoco shadow-fuoco mb-3">
            <span className="text-3xl">🥪</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-brace-crema">
            Crea il Tuo Panino
          </h2>
          <p className="text-brace-testo-soft text-sm mt-1">
            Scegli gli ingredienti e costruisci il panino dei tuoi sogni
          </p>
        </div>
      )}

      {/* Barra prezzo sticky */}
      <div className="sticky top-0 z-10 bg-brace-nero/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-brace-fumo/30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <span className="text-brace-testo-soft text-xs uppercase tracking-wider">Prezzo panino</span>
            <div className="font-mono text-2xl font-bold text-gradient-fuoco">
              €{prezzoTotale.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-brace-testo-soft text-xs">
              Base €{PREZZO_BASE.toFixed(2)}
            </span>
            {prezzoTotale > PREZZO_BASE && (
              <div className="text-brace-arancio text-xs">
                + €{(prezzoTotale - PREZZO_BASE).toFixed(2)} extra
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorie ingredienti */}
      {categorie.map(cat => {
        const selezionati = selezioni[cat._id] ?? []
        const isObbligatoria = cat.sceltaMinima > 0
        const isSoddisfatta = selezionati.length >= cat.sceltaMinima

        return (
          <section key={cat._id} className="animate-fade-in">

            {/* Header categoria */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cat.icona}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-brace-testo">{cat.nome}</h3>
                  {isObbligatoria && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-brace-rosso/20 text-brace-rosso-vivo border border-brace-rosso/30">
                      obbligatorio
                    </span>
                  )}
                  {isSoddisfatta && selezionati.length > 0 && (
                    <span className="text-xs text-green-400">✓</span>
                  )}
                </div>
                <p className="text-xs text-brace-testo-soft mt-0.5">
                  {cat.sceltaMinima === 0 && cat.sceltaMassima === 1
                    ? 'Opzionale, max 1'
                    : cat.sceltaMinima === 1 && cat.sceltaMassima === 1
                      ? 'Scegli 1'
                      : cat.sceltaMinima === 0
                        ? `Opzionale, max ${cat.sceltaMassima}`
                        : `Min ${cat.sceltaMinima}, max ${cat.sceltaMassima}`
                  }
                  {selezionati.length > 0 && ` • ${selezionati.length} selezionati`}
                </p>
              </div>
            </div>

            {/* Grid ingredienti */}
            <div className="grid grid-cols-2 gap-2">
              {cat.ingredienti.map(ing => {
                const isSelected = selezionati.includes(ing._id)
                return (
                  <button
                    key={ing._id}
                    onClick={() => toggleIngrediente(cat._id, ing._id, cat.sceltaMassima)}
                    className={`relative flex flex-col items-start p-3 rounded-xl border-2
                               text-left transition-all duration-150 active:scale-95
                               ${isSelected
                                 ? 'border-brace-arancio bg-brace-arancio/10'
                                 : 'border-brace-fumo bg-brace-carbone hover:border-brace-fumo/80'
                               }`}
                  >
                    {/* Check badge */}
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brace-arancio flex items-center justify-center text-xs text-white font-bold">
                        ✓
                      </span>
                    )}
                    <span className={`text-sm font-medium leading-tight ${
                      isSelected ? 'text-brace-crema' : 'text-brace-testo'
                    }`}>
                      {ing.nome}
                    </span>
                    {ing.prezzoExtra > 0 && (
                      <span className={`text-xs mt-1 font-mono ${
                        isSelected ? 'text-brace-arancio' : 'text-brace-testo-soft'
                      }`}>
                        +€{ing.prezzoExtra.toFixed(2)}
                      </span>
                    )}
                    {ing.prezzoExtra === 0 && (
                      <span className="text-xs mt-1 text-brace-testo-soft opacity-60">incluso</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Note aggiuntive */}
      <div>
        <label className="label">Note per il cuoco (opzionale)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Es: pane ben tostato, salsa a parte..."
          className="input resize-none"
          rows={2}
        />
      </div>

      {/* Riepilogo selezioni */}
      {Object.values(selezioni).flat().length > 0 && (
        <div className="card p-4 bg-brace-fumo/30">
          <h4 className="text-xs uppercase tracking-wider text-brace-testo-soft mb-2">
            Il tuo panino:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(selezioni).flatMap(([catId, ingIds]) => {
              const cat = categorie.find(c => c._id === catId)
              return ingIds.map(ingId => {
                const ing = cat?.ingredienti.find(i => i._id === ingId)
                if (!ing) return null
                return (
                  <span
                    key={ingId}
                    className="text-xs px-2.5 py-1 rounded-full bg-brace-carbone border border-brace-fumo text-brace-testo"
                  >
                    {ing.nome}
                    {ing.prezzoExtra > 0 && (
                      <span className="text-brace-arancio ml-1">+€{ing.prezzoExtra.toFixed(2)}</span>
                    )}
                  </span>
                )
              })
            })}
          </div>
        </div>
      )}

      {/* Pulsante aggiungi */}
      <button
        onClick={aggiungiAlCarrello}
        disabled={aggiunta}
        className={`btn-primary w-full text-lg py-4 flex items-center justify-center gap-2
                   ${aggiunta ? 'opacity-80' : ''}`}
      >
        {aggiunta ? (
          <>
            <span className="text-xl">✅</span>
            Aggiunto al carrello!
          </>
        ) : (
          <>
            <span className="text-xl">🛒</span>
            Aggiungi al Carrello — €{prezzoTotale.toFixed(2)}
          </>
        )}
      </button>
    </div>
  )
}
