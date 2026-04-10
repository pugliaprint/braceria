'use client'
/**
 * components/menu/MenuList.tsx
 * Lista menu con categorie, filtri e aggiunta al carrello.
 * Usato sia nella pagina ordine al tavolo che nel delivery.
 */
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/components/providers/CartProvider'
import toast from 'react-hot-toast'

interface Categoria { _id: string; nome: string; icona: string }
interface Piatto {
  _id: string; nome: string; descrizione?: string; prezzo: number
  categoria: Categoria; immagine?: string; disponibile: boolean; evidenziato: boolean
}

interface MenuListProps {
  onApriBuilder: () => void   // apri il panino builder
  showBuilder?: boolean
}

export default function MenuList({ onApriBuilder, showBuilder = true }: MenuListProps) {
  const { addItem, state, totalePezzi } = useCart()
  const [piatti, setPiatti]     = useState<Piatto[]>([])
  const [categorie, setCategorie] = useState<Categoria[]>([])
  const [catAttiva, setCatAttiva]   = useState('')
  const [loading, setLoading]       = useState(true)
  const catRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/menu?disponibili=true').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([p, c]) => {
      setPiatti(p)
      setCategorie(c)
      if (c.length > 0) setCatAttiva(c[0]._id)
    }).finally(() => setLoading(false))
  }, [])

  const scrollToCategoria = (id: string) => {
    setCatAttiva(id)
    catRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const aggiungiPiatto = (piatto: Piatto) => {
    // Controlla se già nel carrello
    const esistente = state.items.find(i => i.menuItemId === piatto._id)
    if (esistente) {
      // Incrementa quantità
      addItem({
        id: piatto._id,
        tipo: 'piatto',
        nomePiatto: piatto.nome,
        prezzoUnitario: piatto.prezzo,
        quantita: 1,
        menuItemId: piatto._id,
      })
    } else {
      addItem({
        id: piatto._id,
        tipo: 'piatto',
        nomePiatto: piatto.nome,
        prezzoUnitario: piatto.prezzo,
        quantita: 1,
        menuItemId: piatto._id,
      })
    }
    toast.success(`+1 ${piatto.nome}`, { duration: 1500 })
  }

  const qtaInCarrello = (piattoId: string) =>
    state.items.find(i => i.menuItemId === piattoId)?.quantita ?? 0

  const piattiPerCat = categorie.reduce<Record<string, Piatto[]>>((acc, cat) => {
    acc[cat._id] = piatti.filter(p => p.categoria?._id === cat._id)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-20 bg-brace-carbone rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Nav categorie */}
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-brace-fumo/30"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Builder panino come prima opzione */}
        {showBuilder && (
          <button
            onClick={onApriBuilder}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       text-sm font-medium bg-gradient-fuoco text-white shadow-fuoco
                       active:scale-95 transition-all"
          >
            <span>🥪</span>
            <span>Crea Panino</span>
          </button>
        )}
        {categorie.map(cat => (
          <button
            key={cat._id}
            onClick={() => scrollToCategoria(cat._id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       text-sm font-medium transition-all duration-200 active:scale-95
                       ${catAttiva === cat._id
                         ? 'bg-brace-brace/20 text-brace-arancio border border-brace-brace/50'
                         : 'bg-brace-carbone text-brace-testo-soft hover:text-brace-testo'
                       }`}
          >
            <span>{cat.icona}</span>
            <span>{cat.nome}</span>
          </button>
        ))}
      </div>

      {/* Piatti per categoria */}
      <div className="px-4 pt-4 pb-32 flex flex-col gap-8">
        {categorie.map(cat => {
          const piattiCat = piattiPerCat[cat._id] ?? []
          if (piattiCat.length === 0) return null
          return (
            <section
              key={cat._id}
              ref={el => { catRefs.current[cat._id] = el }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cat.icona}</span>
                <h2 className="font-display text-lg font-bold text-brace-crema">{cat.nome}</h2>
                <div className="flex-1 h-px bg-brace-fumo/40" />
              </div>

              <div className="flex flex-col gap-2.5">
                {piattiCat.map(piatto => {
                  const qta = qtaInCarrello(piatto._id)
                  return (
                    <div
                      key={piatto._id}
                      className={`card flex items-center gap-3 p-3.5 ${
                        piatto.evidenziato ? 'border-brace-brace/40' : ''
                      }`}
                    >
                      {piatto.immagine && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-brace-fumo">
                          <img src={piatto.immagine} alt={piatto.nome} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-brace-testo text-sm leading-tight">
                              {piatto.evidenziato && <span className="text-brace-oro mr-1">★</span>}
                              {piatto.nome}
                            </p>
                            {piatto.descrizione && (
                              <p className="text-brace-testo-soft text-xs mt-0.5 leading-snug line-clamp-2">
                                {piatto.descrizione}
                              </p>
                            )}
                          </div>
                          <span className="flex-shrink-0 font-mono font-semibold text-brace-arancio text-sm">
                            €{piatto.prezzo.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Bottone aggiungi */}
                      <div className="flex-shrink-0">
                        {qta > 0 ? (
                          <div className="flex items-center gap-1.5 bg-brace-fumo rounded-xl px-2 py-1">
                            <span className="text-brace-arancio font-semibold text-sm w-5 text-center">
                              {qta}
                            </span>
                          </div>
                        ) : null}
                        <button
                          onClick={() => aggiungiPiatto(piatto)}
                          className="mt-1 w-9 h-9 rounded-xl bg-gradient-fuoco text-white text-xl font-bold
                                     flex items-center justify-center shadow-fuoco
                                     active:scale-90 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
