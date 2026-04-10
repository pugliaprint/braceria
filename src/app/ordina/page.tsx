'use client'
/**
 * app/ordina/page.tsx
 * Pagina intermedia "Ordina al Tavolo".
 * Mostra istruzioni per usare il QR code.
 * Chi scannerizza il QR va direttamente a /ordine/[N].
 */
import Link from 'next/link'

export default function OrdinaPage() {
  return (
    <div className="min-h-screen bg-brace-nero bg-texture-carbone flex flex-col">
      <header className="px-4 pt-safe pt-5 pb-4 flex items-center gap-3">
        <Link href="/" className="btn-ghost p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-display text-xl font-bold text-brace-crema">Ordina al Tavolo</h1>
      </header>

      <main className="flex-1 px-5 py-8 max-w-md mx-auto flex flex-col items-center text-center gap-8">
        <div className="animate-slide-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-fuoco shadow-fuoco-lg mb-5">
            <span className="text-5xl">📱</span>
          </div>
          <h2 className="font-display text-3xl font-black text-brace-crema mb-3">
            Scansiona il QR<br />sul tuo tavolo
          </h2>
          <p className="text-brace-testo-soft leading-relaxed">
            Su ogni tavolo trovi un QR code. Puntaci la fotocamera del tuo telefono per accedere al menu e ordinare direttamente dal tavolo.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <div className="card p-4 flex items-center gap-4 text-left">
            <span className="text-3xl flex-shrink-0">1️⃣</span>
            <div>
              <p className="font-semibold text-brace-testo">Apri la fotocamera</p>
              <p className="text-brace-testo-soft text-sm">Usa la fotocamera nativa del telefono</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4 text-left">
            <span className="text-3xl flex-shrink-0">2️⃣</span>
            <div>
              <p className="font-semibold text-brace-testo">Inquadra il QR code</p>
              <p className="text-brace-testo-soft text-sm">Il codice è sul segnaposto al tuo tavolo</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4 text-left">
            <span className="text-3xl flex-shrink-0">3️⃣</span>
            <div>
              <p className="font-semibold text-brace-testo">Ordina e aspetta</p>
              <p className="text-brace-testo-soft text-sm">L'ordine arriva direttamente in cucina</p>
            </div>
          </div>
        </div>

        {/* Test link per sviluppo */}
        <div className="w-full animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <p className="text-brace-testo-soft text-xs mb-2">Stai testando? Scegli un tavolo:</p>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4,5,6,7,8].map(n => (
              <Link
                key={n}
                href={`/ordine/${n}`}
                className="card py-3 text-center font-display text-lg font-bold text-brace-testo
                           hover:border-brace-arancio/50 hover:text-brace-arancio
                           active:scale-95 transition-all"
              >
                {n}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
