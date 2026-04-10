/**
 * app/page.tsx
 * Homepage della Braceria Sannicandro.
 * Mobile-first, tema scuro con colori fuoco.
 * Tre CTA principali: Prenota | Ordina al Tavolo | Delivery
 */
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brace-nero bg-texture-carbone flex flex-col">

      {/* ---- Hero ---- */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-16 pb-8 text-center overflow-hidden">

        {/* Decorazione fuoco sfondo */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-10 left-1/4 w-2 h-2 rounded-full bg-brace-fiamma animate-ember opacity-60" />
          <div className="absolute top-20 right-1/3 w-1.5 h-1.5 rounded-full bg-brace-arancio animate-ember-delay opacity-40" />
          <div className="absolute top-32 left-1/2 w-1 h-1 rounded-full bg-brace-brace animate-ember opacity-50" />
          <div
            className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(211,84,0,0.6) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Logo / Brand */}
        <div className="relative z-10 mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-fuoco shadow-fuoco-lg mb-4">
            <span className="text-4xl" role="img" aria-label="Braceria">🔥</span>
          </div>
          <h1
            className="font-display text-4xl sm:text-5xl font-black text-brace-crema leading-tight"
            style={{ textShadow: '0 2px 20px rgba(211,84,0,0.4)' }}
          >
            Braceria
            <br />
            <span className="text-gradient-fuoco">Sannicandro</span>
          </h1>
          <p className="mt-3 text-brace-testo-soft text-sm tracking-widest uppercase">
            Sannicandro di Bari
          </p>
        </div>

        {/* Sottotitolo */}
        <p className="relative z-10 text-brace-testo text-lg max-w-xs leading-relaxed animate-slide-up">
          Carne alla brace, bombette pugliesi,<br />grigliata mista artigianale.
        </p>
      </section>

      {/* ---- 3 CTA Principali ---- */}
      <section className="flex-1 px-4 pt-4 pb-8 flex flex-col gap-4 max-w-md mx-auto w-full">

        {/* 1 — Prenota Tavolo */}
        <Link
          href="/prenota"
          className="group card relative overflow-hidden flex items-center gap-4 p-5
                     hover:border-brace-arancio/70 active:scale-98
                     transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brace-fumo flex items-center justify-center
                          group-hover:bg-gradient-fuoco group-hover:shadow-fuoco
                          transition-all duration-300">
            <span className="text-3xl">📅</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-brace-crema group-hover:text-gradient-fuoco transition-all">
              Prenota il Tavolo
            </h2>
            <p className="text-brace-testo-soft text-sm mt-0.5">
              Scegli data, orario e numero di persone
            </p>
          </div>
          <ChevronRight />
        </Link>

        {/* 2 — Ordina al Tavolo (QR) */}
        <Link
          href="/ordina"
          className="group card relative overflow-hidden flex items-center gap-4 p-5
                     hover:border-brace-rosso/70 active:scale-98
                     transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brace-fumo flex items-center justify-center
                          group-hover:bg-brace-rosso group-hover:shadow-rosso
                          transition-all duration-300">
            <span className="text-3xl">🍽️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-brace-crema">
              Ordina al Tavolo
            </h2>
            <p className="text-brace-testo-soft text-sm mt-0.5">
              Scansiona il QR code sul tavolo
            </p>
          </div>
          <ChevronRight />
        </Link>

        {/* 3 — Delivery */}
        <Link
          href="/delivery"
          className="group card relative overflow-hidden flex items-center gap-4 p-5
                     hover:border-brace-fiamma/70 active:scale-98
                     transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-brace-fumo flex items-center justify-center
                          group-hover:bg-brace-fiamma/20 group-hover:shadow-fuoco
                          transition-all duration-300">
            <span className="text-3xl">🛵</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-brace-crema">
              Ordina a Domicilio
            </h2>
            <p className="text-brace-testo-soft text-sm mt-0.5">
              Consegna a Sannicandro di Bari • €1,00
            </p>
          </div>
          <ChevronRight />
        </Link>

        {/* Divider decorativo */}
        <div className="divider-brace">
          <span className="text-brace-testo-soft text-xs tracking-widest uppercase">oppure</span>
        </div>

        {/* Menu digitale */}
        <Link
          href="/menu"
          className="flex items-center justify-center gap-2 py-3 px-5
                     text-brace-testo-soft hover:text-brace-testo text-sm
                     border border-brace-fumo/50 rounded-xl
                     hover:border-brace-fumo hover:bg-brace-fumo/20
                     transition-all duration-200"
        >
          <span>📋</span>
          <span>Sfoglia il menu completo</span>
        </Link>
      </section>

      {/* ---- Footer minimalista ---- */}
      <footer className="px-5 py-6 text-center text-brace-testo-soft text-xs border-t border-brace-fumo/30">
        <p className="font-medium">Braceria Sannicandro</p>
        <p className="mt-1">Via XX Settembre 12, Sannicandro di Bari (BA)</p>
        <p className="mt-3 text-brace-fumo text-xs">
          Cucina aperta la sera dal martedì alla domenica
        </p>
      </footer>
    </main>
  )
}

function ChevronRight() {
  return (
    <svg
      className="w-5 h-5 text-brace-testo-soft group-hover:text-brace-arancio group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
