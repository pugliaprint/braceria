'use client'
/**
 * app/prenota/page.tsx
 * Pagina prenotazione tavolo.
 * Step: 1.Data → 2.Fascia Oraria → 3.Persone → 4.Dati → 5.Conferma
 */
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, addDays, isBefore, startOfToday, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface DisponibilitaFascia {
  fascia: string
  postiTotali: number
  postiLiberi: number
  disponibile: boolean
}

const STEP_LABELS = ['Data', 'Orario', 'Persone', 'Dati', 'Conferma']

export default function PrenotaPage() {
  const router = useRouter()

  // ---- Step state ----
  const [step, setStep] = useState(1)

  // ---- Form data ----
  const [dataSelezionata, setDataSelezionata] = useState<string>('')
  const [fasciaSelezionata, setFasciaSelezionata] = useState<string>('')
  const [numerPersone, setNumerPersone] = useState<number>(2)
  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [note, setNote] = useState('')

  // ---- Disponibilità ----
  const [disponibilita, setDisponibilita] = useState<DisponibilitaFascia[]>([])
  const [loadingDisp, setLoadingDisp] = useState(false)

  // ---- Invio ----
  const [loading, setLoading] = useState(false)
  const [prenotazioneId, setPrenotazioneId] = useState<string>('')

  // Genera i prossimi 30 giorni selezionabili
  const oggi = startOfToday()
  const dateDisponibili = Array.from({ length: 30 }, (_, i) => addDays(oggi, i + 1))

  // Carica disponibilità quando cambia la data
  useEffect(() => {
    if (!dataSelezionata) return
    setLoadingDisp(true)
    setDisponibilita([])
    setFasciaSelezionata('')

    fetch(`/api/reservations?tipo=disponibilita&data=${dataSelezionata}`)
      .then(r => r.json())
      .then(data => setDisponibilita(data))
      .catch(() => toast.error('Errore caricamento disponibilità'))
      .finally(() => setLoadingDisp(false))
  }, [dataSelezionata])

  const handleSubmit = async () => {
    if (!nome.trim() || !telefono.trim()) {
      toast.error('Inserisci nome e telefono')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          telefono: telefono.trim(),
          data: dataSelezionata,
          fasciaOraria: fasciaSelezionata,
          numerPersone,
          note: note.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Errore prenotazione')
        return
      }

      setPrenotazioneId(data._id)
      setStep(5)
    } catch {
      toast.error('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  const dataFormattata = dataSelezionata
    ? format(parseISO(dataSelezionata), 'EEEE d MMMM yyyy', { locale: it })
    : ''

  return (
    <div className="min-h-screen bg-brace-nero bg-texture-carbone">

      {/* Header */}
      <header className="px-4 pt-safe pt-5 pb-4 flex items-center gap-3">
        <Link href="/" className="btn-ghost p-2 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-brace-crema">Prenota Tavolo</h1>
          {step < 5 && (
            <p className="text-brace-testo-soft text-xs">Step {step} di 4</p>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {step < 5 && (
        <div className="px-4 mb-6">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gradient-fuoco' : 'bg-brace-fumo'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {STEP_LABELS.slice(0, 4).map((label, i) => (
              <span
                key={i}
                className={`text-xs transition-colors ${
                  i + 1 <= step ? 'text-brace-arancio' : 'text-brace-testo-soft'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pb-safe pb-8 max-w-md mx-auto">

        {/* ---- STEP 1: Scegli data ---- */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="font-display text-2xl font-bold text-brace-crema mb-2">
              Quando vuoi venire?
            </h2>
            <p className="text-brace-testo-soft text-sm mb-6">
              Seleziona la data della tua visita
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {dateDisponibili.map(data => {
                const dataStr = format(data, 'yyyy-MM-dd')
                const isSelected = dataStr === dataSelezionata
                const giorno = format(data, 'EEE', { locale: it })
                const numero = format(data, 'd')
                const mese = format(data, 'MMM', { locale: it })

                return (
                  <button
                    key={dataStr}
                    onClick={() => { setDataSelezionata(dataStr); setStep(2) }}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'border-brace-arancio bg-brace-arancio/10 shadow-fuoco'
                        : 'border-brace-fumo bg-brace-carbone hover:border-brace-brace'
                    }`}
                  >
                    <div className={`text-xs uppercase tracking-wider mb-1 ${
                      isSelected ? 'text-brace-arancio' : 'text-brace-testo-soft'
                    }`}>
                      {giorno}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-display text-3xl font-bold ${
                        isSelected ? 'text-brace-crema' : 'text-brace-testo'
                      }`}>
                        {numero}
                      </span>
                      <span className={`text-sm ${
                        isSelected ? 'text-brace-arancio' : 'text-brace-testo-soft'
                      }`}>
                        {mese}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ---- STEP 2: Scegli fascia oraria ---- */}
        {step === 2 && (
          <div className="animate-slide-up">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-brace-testo-soft text-sm mb-5 hover:text-brace-testo"
            >
              ← {dataFormattata}
            </button>

            <h2 className="font-display text-2xl font-bold text-brace-crema mb-2">
              A che ora?
            </h2>
            <p className="text-brace-testo-soft text-sm mb-6">
              Scegli la fascia oraria preferita
            </p>

            {loadingDisp ? (
              <div className="flex flex-col gap-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-16 bg-brace-carbone rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {disponibilita.map(d => {
                  const isSelected = d.fascia === fasciaSelezionata
                  return (
                    <button
                      key={d.fascia}
                      onClick={() => {
                        if (!d.disponibile) return
                        setFasciaSelezionata(d.fascia)
                        setStep(3)
                      }}
                      disabled={!d.disponibile}
                      className={`flex items-center justify-between p-4 rounded-xl border-2
                        transition-all duration-200 active:scale-98
                        ${!d.disponibile
                          ? 'border-brace-fumo/30 bg-brace-carbone/50 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'border-brace-arancio bg-brace-arancio/10 shadow-fuoco'
                            : 'border-brace-fumo bg-brace-carbone hover:border-brace-brace'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display text-2xl font-bold text-brace-crema">
                          {d.fascia}
                        </span>
                      </div>
                      <div className="text-right">
                        {d.disponibile ? (
                          <span className={`text-sm font-medium ${
                            d.postiLiberi <= 8 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {d.postiLiberi <= 8 ? '⚠️' : '✅'} {d.postiLiberi} posti liberi
                          </span>
                        ) : (
                          <span className="text-sm text-red-400">❌ Completo</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 3: Numero persone ---- */}
        {step === 3 && (
          <div className="animate-slide-up">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-brace-testo-soft text-sm mb-5 hover:text-brace-testo"
            >
              ← {dataFormattata} alle {fasciaSelezionata}
            </button>

            <h2 className="font-display text-2xl font-bold text-brace-crema mb-2">
              Quante persone?
            </h2>
            <p className="text-brace-testo-soft text-sm mb-8">
              Seleziona il numero di commensali
            </p>

            {/* Selettore grande */}
            <div className="flex items-center justify-center gap-6 mb-10">
              <button
                onClick={() => setNumerPersone(p => Math.max(1, p - 1))}
                className="w-16 h-16 rounded-2xl bg-brace-carbone border-2 border-brace-fumo
                           text-3xl font-bold text-brace-testo
                           hover:border-brace-brace active:scale-90 transition-all"
              >
                −
              </button>
              <div className="text-center">
                <span className="font-display text-7xl font-black text-gradient-fuoco block leading-none">
                  {numerPersone}
                </span>
                <span className="text-brace-testo-soft text-sm mt-1 block">
                  {numerPersone === 1 ? 'persona' : 'persone'}
                </span>
              </div>
              <button
                onClick={() => setNumerPersone(p => Math.min(20, p + 1))}
                className="w-16 h-16 rounded-2xl bg-brace-carbone border-2 border-brace-fumo
                           text-3xl font-bold text-brace-testo
                           hover:border-brace-brace active:scale-90 transition-all"
              >
                +
              </button>
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-5 gap-2 mb-8">
              {[1, 2, 3, 4, 6].map(n => (
                <button
                  key={n}
                  onClick={() => setNumerPersone(n)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    numerPersone === n
                      ? 'bg-gradient-fuoco text-white shadow-fuoco'
                      : 'bg-brace-carbone border border-brace-fumo text-brace-testo-soft hover:border-brace-brace'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {numerPersone > 10 && (
              <div className="bg-brace-fumo/50 rounded-xl p-3 mb-6 text-sm text-brace-testo-soft text-center">
                💡 Per gruppi numerosi ti consigliamo di chiamarci direttamente
              </div>
            )}

            <button
              onClick={() => setStep(4)}
              className="btn-primary w-full text-lg py-4"
            >
              Continua →
            </button>
          </div>
        )}

        {/* ---- STEP 4: Dati personali ---- */}
        {step === 4 && (
          <div className="animate-slide-up">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 text-brace-testo-soft text-sm mb-5 hover:text-brace-testo"
            >
              ← {numerPersone} {numerPersone === 1 ? 'persona' : 'persone'}
            </button>

            <h2 className="font-display text-2xl font-bold text-brace-crema mb-2">
              I tuoi dati
            </h2>
            <p className="text-brace-testo-soft text-sm mb-6">
              Ti contatteremo solo se necessario
            </p>

            {/* Riepilogo */}
            <div className="card p-4 mb-6 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-brace-testo-soft">📅</span>
                <span className="text-brace-testo capitalize">{dataFormattata}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-brace-testo-soft">🕐</span>
                <span className="text-brace-testo">{fasciaSelezionata}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-brace-testo-soft">👥</span>
                <span className="text-brace-testo">{numerPersone} {numerPersone === 1 ? 'persona' : 'persone'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Nome e Cognome *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Mario Rossi"
                  className="input"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="label">Numero di Telefono *</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="input"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="label">Note (opzionale)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Allergie, occasioni speciali, seggiolone per bambini..."
                  className="input resize-none"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !nome.trim() || !telefono.trim()}
              className="btn-primary w-full text-lg py-4 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Prenotazione in corso...
                </span>
              ) : (
                '✅ Conferma Prenotazione'
              )}
            </button>

            <p className="text-center text-xs text-brace-testo-soft mt-3">
              Gratuito, senza registrazione richiesta
            </p>
          </div>
        )}

        {/* ---- STEP 5: Conferma ---- */}
        {step === 5 && (
          <div className="animate-bounce-in text-center py-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-fuoco shadow-fuoco-lg mb-6">
              <span className="text-5xl">🎉</span>
            </div>

            <h2 className="font-display text-3xl font-black text-brace-crema mb-3">
              Prenotazione Confermata!
            </h2>

            <div className="card p-5 text-left mb-6 mt-6">
              <h3 className="font-semibold text-brace-testo mb-3 text-sm uppercase tracking-wider">
                Riepilogo
              </h3>
              <div className="flex flex-col gap-2">
                <InfoRow icon="👤" label="Nome" value={nome} />
                <InfoRow icon="📅" label="Data" value={dataFormattata} capitalize />
                <InfoRow icon="🕐" label="Orario" value={fasciaSelezionata} />
                <InfoRow icon="👥" label="Persone" value={`${numerPersone} ${numerPersone === 1 ? 'persona' : 'persone'}`} />
                {note && <InfoRow icon="📝" label="Note" value={note} />}
              </div>
            </div>

            <p className="text-brace-testo-soft text-sm mb-8">
              Ti aspettiamo! Se hai bisogno di modificare la prenotazione chiamaci direttamente.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/" className="btn-primary block text-center py-4 text-lg">
                🏠 Torna alla Home
              </Link>
              <Link href="/menu" className="btn-ghost text-center py-3">
                Sfoglia il menu →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon, label, value, capitalize
}: {
  icon: string; label: string; value: string; capitalize?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="w-5 text-center flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-brace-testo-soft flex-shrink-0">{label}:</span>
      <span className={`text-brace-testo font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  )
}
