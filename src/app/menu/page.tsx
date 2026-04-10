'use client'
/**
 * app/menu/page.tsx
 * Menu digitale pubblico - visualizzazione piatti divisi per categoria.
 * Usato sia come menu di consultazione che come base per ordini.
 */
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Categoria {
  _id: string
  nome: string
  icona: string
}

interface Piatto {
  _id: string
  nome: string
  descrizione?: string
  prezzo: number
  categoria: Categoria
  immagine?: string
  disponibile: boolean
  evidenziato: boolean
}

export default function MenuPage() {
  const [piatti, setPiatti] = useState<Piatto[]>([])
  const [categorie, setCategorie] = useState<Categoria[]>([])
  const [categoriaAttiva, setCategoriaAttiva] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const catRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/menu?disponibili=true').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([p, c]) => {
      setPiatti(p)
      setCategorie(c)
      if (c.length > 0) setCategoriaAttiva(c[0]._id)
    }).finally(() => setLoading(false))
  }, [])

  const scrollToCategoria = (id: string) => {
    setCategoriaAttiva(id)
    catRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Raggruppa piatti per categoria
  const piattiPerCategoria = categorie.reduce<Record<string, Piatto[]>>((acc, cat) => {
    acc[cat._id] = piatti.filter(p => p.categoria?._id === cat._id)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-brace-nero flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl animate-pulse">🔥</span>
          <p className="text-brace-testo-soft mt-3">Caricamento menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brace-nero">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-brace-nero/95 backdrop-blur-sm border-b border-brace-fumo/50">
        <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3">
          <Link href="/" className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-brace-crema">Il Nostro Menu</h1>
            <p className="text-brace-testo-soft text-xs">Braceria Sannicandro</p>
          </div>
        </div>

        {/* Nav categorie con scroll orizzontale */}
        <div
          ref={navRef}
          className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none' }}
        >
          {categorie.map(cat => (
            <button
              key={cat._id}
              onClick={() => scrollToCategoria(cat._id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         text-sm font-medium transition-all duration-200 snap-start
                         ${categoriaAttiva === cat._id
                           ? 'bg-gradient-fuoco text-white shadow-fuoco'
                           : 'bg-brace-carbone text-brace-testo-soft hover:text-brace-testo'
                         }`}
            >
              <span>{cat.icona}</span>
              <span>{cat.nome}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Contenuto menu */}
      <main className="px-4 py-6 pb-safe pb-24 max-w-2xl mx-auto">
        {categorie.map(cat => {
          const piattiCat = piattiPerCategoria[cat._id] ?? []
          if (piattiCat.length === 0) return null

          return (
            <section
              key={cat._id}
              ref={el => { catRefs.current[cat._id] = el }}
              className="mb-10 scroll-mt-32"
              id={`cat-${cat._id}`}
            >
              {/* Titolo categoria */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{cat.icona}</span>
                <h2 className="font-display text-xl font-bold text-brace-crema">{cat.nome}</h2>
                <div className="flex-1 h-px bg-brace-fumo/50" />
              </div>

              {/* Piatti */}
              <div className="flex flex-col gap-3">
                {piattiCat.map(piatto => (
                  <article
                    key={piatto._id}
                    className={`card p-4 flex gap-4 ${
                      piatto.evidenziato ? 'border-brace-brace/50' : ''
                    }`}
                  >
                    {/* Immagine (se presente) */}
                    {piatto.immagine && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-brace-fumo">
                        <img
                          src={piatto.immagine}
                          alt={piatto.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-brace-testo text-base leading-tight">
                            {piatto.evidenziato && (
                              <span className="text-brace-oro text-xs mr-1.5">★</span>
                            )}
                            {piatto.nome}
                          </h3>
                          {piatto.descrizione && (
                            <p className="text-brace-testo-soft text-sm mt-1 leading-snug line-clamp-2">
                              {piatto.descrizione}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="font-mono font-semibold text-brace-arancio text-base">
                            €{piatto.prezzo.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* Bottom CTA fisso */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-brace-nero/95 backdrop-blur-sm border-t border-brace-fumo/50">
        <div className="flex gap-3 max-w-md mx-auto">
          <Link href="/delivery" className="btn-primary flex-1 text-center py-3.5">
            🛵 Ordina a Domicilio
          </Link>
          <Link href="/prenota" className="btn-secondary flex-1 text-center py-3.5">
            📅 Prenota
          </Link>
        </div>
      </div>
    </div>
  )
}
