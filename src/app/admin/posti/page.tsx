'use client'
/**
 * app/admin/posti/page.tsx
 * Gestione posti per fascia oraria e data.
 * Default settimanale + eccezioni per date specifiche.
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { addDays, format } from 'date-fns'
import { it } from 'date-fns/locale'

const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const FASCE_DEFAULT = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00']

interface Settings {
  postiDefaultPerFascia: Array<{ giornoSettimana: number; fasciaOraria: string; posti: number }>
  postiEccezioni: Array<{ data: string; fasciaOraria: string; posti: number }>
  fasceOrarieDefault: Array<{ ora: string; attiva: boolean }>
}

export default function AdminPostiPage() {
  const [settings, setSettings]     = useState<Settings | null>(null)
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [tab, setTab]               = useState<'default' | 'eccezioni'>('default')

  // Eccezione form
  const [nuovaData, setNuovaData]     = useState('')
  const [nuovaFascia, setNuovaFascia] = useState('20:00')
  const [nuoviPosti, setNuoviPosti]   = useState('40')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => { setSettings(s); setLoading(false) })
  }, [])

  const aggiornaPosti = (giorno: number, fascia: string, valore: number) => {
    if (!settings) return
    const nuovi = [...settings.postiDefaultPerFascia]
    const idx = nuovi.findIndex(p => p.giornoSettimana === giorno && p.fasciaOraria === fascia)
    if (idx >= 0) nuovi[idx] = { ...nuovi[idx], posti: valore }
    else nuovi.push({ giornoSettimana: giorno, fasciaOraria: fascia, posti: valore })
    setSettings(s => s ? { ...s, postiDefaultPerFascia: nuovi } : s)
  }

  const getPosti = (giorno: number, fascia: string) =>
    settings?.postiDefaultPerFascia.find(p => p.giornoSettimana === giorno && p.fasciaOraria === fascia)?.posti ?? 40

  const salvaDefault = async () => {
    setSalvando(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postiDefaultPerFascia: settings?.postiDefaultPerFascia }),
    })
    setSalvando(false)
    if (res.ok) toast.success('Posti default salvati')
    else toast.error('Errore salvataggio')
  }

  const aggiungiEccezione = async () => {
    if (!nuovaData || !nuovaFascia) { toast.error('Compila data e fascia'); return }
    const posti = parseInt(nuoviPosti)
    if (isNaN(posti) || posti < 0) { toast.error('Posti non validi'); return }

    const eccezioni = settings?.postiEccezioni ?? []
    // Rimuovi duplicato se esiste
    const filtrate = eccezioni.filter(e => !(e.data === nuovaData && e.fasciaOraria === nuovaFascia))
    const nuove = [...filtrate, { data: nuovaData, fasciaOraria: nuovaFascia, posti }]

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postiEccezioni: nuove }),
    })
    if (res.ok) {
      toast.success('Eccezione aggiunta')
      setSettings(s => s ? { ...s, postiEccezioni: nuove } : s)
      setNuovaData('')
    } else toast.error('Errore')
  }

  const rimuoviEccezione = async (data: string, fascia: string) => {
    const nuove = (settings?.postiEccezioni ?? []).filter(e => !(e.data === data && e.fasciaOraria === fascia))
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postiEccezioni: nuove }),
    })
    if (res.ok) { toast.success('Rimossa'); setSettings(s => s ? { ...s, postiEccezioni: nuove } : s) }
  }

  const fasce = settings?.fasceOrarieDefault.filter(f => f.attiva).map(f => f.ora) ?? FASCE_DEFAULT

  if (loading) return <div className="flex justify-center py-20"><span className="text-4xl animate-pulse">💺</span></div>

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <h1 className="font-display text-2xl font-black text-brace-crema">Gestione Posti</h1>

      <div className="flex gap-2">
        {['default','eccezioni'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-gradient-fuoco text-white shadow-fuoco' : 'bg-brace-carbone text-brace-testo-soft border border-brace-fumo'
            }`}>
            {t === 'default' ? '📅 Default Settimanale' : '⚠️ Eccezioni per Data'}
          </button>
        ))}
      </div>

      {/* ---- DEFAULT SETTIMANALE ---- */}
      {tab === 'default' && (
        <div className="flex flex-col gap-4">
          <p className="text-brace-testo-soft text-sm">
            Imposta il numero di posti disponibili per ogni giorno della settimana e fascia oraria. Questi valori valgono per tutte le date a meno di eccezioni specifiche.
          </p>

          <div className="card p-4 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-left text-brace-testo-soft font-medium pb-3 pr-3">Fascia</th>
                  {GIORNI.map(g => (
                    <th key={g} className="text-center text-brace-testo-soft font-medium pb-3 px-1">{g}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fasce.map(fascia => (
                  <tr key={fascia} className="border-t border-brace-fumo/30">
                    <td className="py-2 pr-3 font-mono text-brace-arancio font-semibold">{fascia}</td>
                    {GIORNI.map((_, giorno) => (
                      <td key={giorno} className="py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={getPosti(giorno, fascia)}
                          onChange={e => aggiornaPosti(giorno, fascia, parseInt(e.target.value) || 0)}
                          className="w-14 bg-brace-cenere border border-brace-fumo text-brace-testo text-center rounded-lg py-1.5 text-sm
                                     focus:outline-none focus:border-brace-arancio transition-colors"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={salvaDefault} disabled={salvando} className="btn-primary w-fit px-6 py-3">
            {salvando ? 'Salvataggio...' : '💾 Salva Posti Default'}
          </button>
        </div>
      )}

      {/* ---- ECCEZIONI ---- */}
      {tab === 'eccezioni' && (
        <div className="flex flex-col gap-4">
          <p className="text-brace-testo-soft text-sm">
            Sovrascrivi il numero di posti per una data e fascia oraria specifica. Utile per eventi speciali, serate sold-out parziali, ecc.
          </p>

          {/* Form nuova eccezione */}
          <div className="card p-4">
            <h3 className="font-semibold text-brace-testo mb-3">Aggiungi Eccezione</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label text-xs">Data</label>
                <input type="date" value={nuovaData} onChange={e => setNuovaData(e.target.value)} className="input py-2" />
              </div>
              <div>
                <label className="label text-xs">Fascia Oraria</label>
                <select value={nuovaFascia} onChange={e => setNuovaFascia(e.target.value)} className="input py-2">
                  {fasce.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Posti disponibili</label>
                <input type="number" min="0" value={nuoviPosti} onChange={e => setNuoviPosti(e.target.value)} className="input py-2 w-24" />
              </div>
              <button onClick={aggiungiEccezione} className="btn-primary px-4 py-2.5 text-sm">
                + Aggiungi
              </button>
            </div>
          </div>

          {/* Lista eccezioni */}
          {(settings?.postiEccezioni ?? []).length === 0 ? (
            <div className="text-center py-8 text-brace-testo-soft">Nessuna eccezione configurata</div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...(settings?.postiEccezioni ?? [])].sort((a,b) => a.data.localeCompare(b.data)).map(e => (
                <div key={`${e.data}-${e.fasciaOraria}`} className="card p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <span className="font-semibold text-brace-testo capitalize">
                      {format(new Date(e.data), 'EEE d MMM yyyy', { locale: it })}
                    </span>
                    <span className="text-brace-arancio font-mono ml-3">{e.fasciaOraria}</span>
                  </div>
                  <span className="font-display text-2xl font-black text-gradient-fuoco">{e.posti}</span>
                  <span className="text-brace-testo-soft text-sm">posti</span>
                  <button onClick={() => rimuoviEccezione(e.data, e.fasciaOraria)}
                    className="w-8 h-8 rounded-lg bg-red-900/30 text-red-400 flex items-center justify-center hover:bg-red-900/60">
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
