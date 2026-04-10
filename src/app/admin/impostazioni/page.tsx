'use client'
/**
 * app/admin/impostazioni/page.tsx
 * Impostazioni generali: WhatsApp, orari, delivery, PIN cucina, info ristorante.
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Settings {
  nomeRistorante: string
  indirizzoRistorante: string
  telefonoRistorante: string
  deliveryAttivo: boolean
  costoConsegna: number
  pranzoDomenicaAttivo: boolean
  whatsappNumero: string
  whatsappApiKey: string
  whatsappAttivo: boolean
  pinCucina: string
  fasceOrarieDefault: Array<{ ora: string; attiva: boolean }>
}

export default function AdminImpostazioniPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [tab, setTab]           = useState<'ristorante' | 'orari' | 'whatsapp' | 'cucina'>('ristorante')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => { setSettings(s); setLoading(false) })
  }, [])

  const salva = async (dati: Partial<Settings>) => {
    setSalvando(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dati),
    })
    setSalvando(false)
    if (res.ok) { toast.success('Impostazioni salvate'); const d = await res.json(); setSettings(d) }
    else toast.error('Errore salvataggio')
  }

  const toggleFascia = (idx: number) => {
    if (!settings) return
    const nuove = settings.fasceOrarieDefault.map((f, i) => i === idx ? { ...f, attiva: !f.attiva } : f)
    setSettings(s => s ? { ...s, fasceOrarieDefault: nuove } : s)
  }

  const testWhatsapp = async () => {
    if (!settings?.whatsappNumero || !settings?.whatsappApiKey) {
      toast.error('Inserisci numero e API key prima')
      return
    }
    const msg = encodeURIComponent('✅ Test notifica Braceria Sannicandro. Sistema funzionante!')
    const url = `https://api.callmebot.com/whatsapp.php?phone=${settings.whatsappNumero}&text=${msg}&apikey=${settings.whatsappApiKey}`
    const loading = toast.loading('Invio test...')
    try {
      await fetch(url)
      toast.dismiss(loading)
      toast.success('Messaggio inviato! Controlla WhatsApp.')
    } catch {
      toast.dismiss(loading)
      toast.error('Errore invio test')
    }
  }

  if (loading || !settings) return <div className="flex justify-center py-20"><span className="text-4xl animate-pulse">⚙️</span></div>

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="font-display text-2xl font-black text-brace-crema">Impostazioni</h1>

      {/* Tab */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ristorante', label: '🏠 Ristorante' },
          { id: 'orari',      label: '🕐 Orari' },
          { id: 'whatsapp',   label: '📱 WhatsApp' },
          { id: 'cucina',     label: '🍳 Cucina' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-gradient-fuoco text-white shadow-fuoco' : 'bg-brace-carbone text-brace-testo-soft border border-brace-fumo'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- RISTORANTE ---- */}
      {tab === 'ristorante' && (
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-brace-testo">Informazioni Ristorante</h2>
          <div>
            <label className="label">Nome Ristorante</label>
            <input className="input" value={settings.nomeRistorante} onChange={e => setSettings(s => s ? {...s, nomeRistorante: e.target.value} : s)} />
          </div>
          <div>
            <label className="label">Indirizzo</label>
            <input className="input" value={settings.indirizzoRistorante} onChange={e => setSettings(s => s ? {...s, indirizzoRistorante: e.target.value} : s)} />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input className="input" type="tel" value={settings.telefonoRistorante} onChange={e => setSettings(s => s ? {...s, telefonoRistorante: e.target.value} : s)} placeholder="+39 080 xxxxxxx" />
          </div>

          <div className="border-t border-brace-fumo/50 pt-4">
            <h3 className="font-semibold text-brace-testo mb-3">🛵 Delivery</h3>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-brace-testo text-sm">Servizio Delivery</p>
                <p className="text-brace-testo-soft text-xs">{settings.deliveryAttivo ? 'Attivo' : 'Sospeso'}</p>
              </div>
              <button onClick={() => setSettings(s => s ? {...s, deliveryAttivo: !s.deliveryAttivo} : s)}
                className={`relative w-12 h-6 rounded-full transition-all ${settings.deliveryAttivo ? 'bg-green-600' : 'bg-brace-fumo'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.deliveryAttivo ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="label">Costo Consegna (€)</label>
              <input className="input w-28" type="number" step="0.5" min="0" value={settings.costoConsegna}
                onChange={e => setSettings(s => s ? {...s, costoConsegna: parseFloat(e.target.value)} : s)} />
            </div>
          </div>

          <button onClick={() => salva({ nomeRistorante: settings.nomeRistorante, indirizzoRistorante: settings.indirizzoRistorante, telefonoRistorante: settings.telefonoRistorante, deliveryAttivo: settings.deliveryAttivo, costoConsegna: settings.costoConsegna })}
            disabled={salvando} className="btn-primary w-fit px-6 py-3">
            {salvando ? 'Salvataggio...' : '💾 Salva'}
          </button>
        </div>
      )}

      {/* ---- ORARI ---- */}
      {tab === 'orari' && (
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brace-testo">🌞 Pranzo Domenicale</h3>
              <p className="text-brace-testo-soft text-xs">Abilita il servizio pranzo la domenica</p>
            </div>
            <button onClick={() => setSettings(s => s ? {...s, pranzoDomenicaAttivo: !s.pranzoDomenicaAttivo} : s)}
              className={`relative w-12 h-6 rounded-full transition-all ${settings.pranzoDomenicaAttivo ? 'bg-green-600' : 'bg-brace-fumo'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.pranzoDomenicaAttivo ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="border-t border-brace-fumo/50 pt-4">
            <h3 className="font-semibold text-brace-testo mb-3">🕐 Fasce Orarie Cena</h3>
            <div className="flex flex-col gap-2">
              {settings.fasceOrarieDefault.map((f, i) => (
                <div key={f.ora} className="flex items-center justify-between py-2 border-b border-brace-fumo/30 last:border-0">
                  <span className="font-mono text-brace-arancio font-semibold">{f.ora}</span>
                  <button onClick={() => toggleFascia(i)}
                    className={`relative w-10 h-5 rounded-full transition-all ${f.attiva ? 'bg-green-600' : 'bg-brace-fumo'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${f.attiva ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => salva({ pranzoDomenicaAttivo: settings.pranzoDomenicaAttivo, fasceOrarieDefault: settings.fasceOrarieDefault })}
            disabled={salvando} className="btn-primary w-fit px-6 py-3">
            {salvando ? 'Salvataggio...' : '💾 Salva Orari'}
          </button>
        </div>
      )}

      {/* ---- WHATSAPP ---- */}
      {tab === 'whatsapp' && (
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brace-testo">📱 Notifiche WhatsApp</h3>
              <p className="text-brace-testo-soft text-xs">Tramite CallMeBot (gratuito)</p>
            </div>
            <button onClick={() => setSettings(s => s ? {...s, whatsappAttivo: !s.whatsappAttivo} : s)}
              className={`relative w-12 h-6 rounded-full transition-all ${settings.whatsappAttivo ? 'bg-green-600' : 'bg-brace-fumo'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.whatsappAttivo ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="bg-brace-fumo/30 rounded-xl p-4 text-sm text-brace-testo-soft">
            <p className="font-semibold text-brace-testo mb-2">Setup CallMeBot:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Aggiungi <strong className="text-brace-testo">+34 644 91 87 47</strong> ai contatti come "CallMeBot"</li>
              <li>Invia "<strong className="text-brace-testo">I allow callmebot to send me messages</strong>" su WhatsApp</li>
              <li>Ricevi la tua API key via messaggio (in pochi minuti)</li>
              <li>Inserisci numero e API key qui sotto</li>
            </ol>
          </div>

          <div>
            <label className="label">Numero WhatsApp (con prefisso, senza +)</label>
            <input className="input" type="tel" value={settings.whatsappNumero}
              onChange={e => setSettings(s => s ? {...s, whatsappNumero: e.target.value} : s)}
              placeholder="393331234567" />
            <p className="text-xs text-brace-testo-soft mt-1">Es: 393331234567 (Italia +39, poi il numero)</p>
          </div>
          <div>
            <label className="label">API Key CallMeBot</label>
            <input className="input font-mono" value={settings.whatsappApiKey}
              onChange={e => setSettings(s => s ? {...s, whatsappApiKey: e.target.value} : s)}
              placeholder="123456" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => salva({ whatsappNumero: settings.whatsappNumero, whatsappApiKey: settings.whatsappApiKey, whatsappAttivo: settings.whatsappAttivo })}
              disabled={salvando} className="btn-primary px-6 py-3">
              {salvando ? 'Salvataggio...' : '💾 Salva'}
            </button>
            <button onClick={testWhatsapp} className="btn-secondary px-5 py-3">
              📤 Invia Test
            </button>
          </div>
        </div>
      )}

      {/* ---- CUCINA ---- */}
      {tab === 'cucina' && (
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-brace-testo">🍳 Accesso Dashboard Cucina</h3>
          <p className="text-brace-testo-soft text-sm">Il PIN viene richiesto per accedere alla dashboard cucina dal tablet.</p>
          <div>
            <label className="label">PIN Cucina (4 cifre)</label>
            <input
              className="input font-mono text-2xl tracking-widest w-32"
              type="text" maxLength={4} pattern="[0-9]{4}"
              value={settings.pinCucina}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setSettings(s => s ? {...s, pinCucina: val} : s)
              }}
              placeholder="1234"
            />
          </div>
          <div className="bg-brace-fumo/30 rounded-xl p-3 text-sm text-brace-testo-soft">
            <p>💡 Apri la cucina all'indirizzo: <span className="font-mono text-brace-arancio">/cucina</span></p>
            <p className="mt-1">Ideale su un tablet posizionato in cucina, schermo sempre acceso.</p>
          </div>
          <button onClick={() => salva({ pinCucina: settings.pinCucina })}
            disabled={salvando} className="btn-primary w-fit px-6 py-3">
            {salvando ? 'Salvataggio...' : '💾 Salva PIN'}
          </button>
        </div>
      )}
    </div>
  )
}
