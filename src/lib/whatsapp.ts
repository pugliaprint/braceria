/**
 * lib/whatsapp.ts
 * Invio notifiche WhatsApp tramite CallMeBot API (gratuita).
 *
 * Setup CallMeBot:
 * 1. Aggiungi +34 644 91 87 47 ai contatti come "CallMeBot"
 * 2. Invia "I allow callmebot to send me messages" su WhatsApp
 * 3. Ricevi la tua API key via messaggio
 * 4. Inserisci numero e API key nelle Settings del pannello admin
 */

import Settings from '@/models/Settings'
import { connectDB } from './mongodb'

export async function inviaNotificaWhatsApp(messaggio: string): Promise<boolean> {
  try {
    await connectDB()
    const settings = await Settings.findOne().lean()

    if (!settings?.whatsappAttivo) return false
    if (!settings.whatsappNumero || !settings.whatsappApiKey) return false

    const url = new URL('https://api.callmebot.com/whatsapp.php')
    url.searchParams.set('phone', settings.whatsappNumero)
    url.searchParams.set('text', messaggio)
    url.searchParams.set('apikey', settings.whatsappApiKey)

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(8000), // timeout 8 secondi
    })

    return res.ok
  } catch (err) {
    console.error('[WhatsApp] Errore invio notifica:', err)
    return false
  }
}

// ---- Template messaggi ----

export function messaggioNuovoOrdine(ordine: {
  numeroOrdine: number
  tipo: string
  voci: Array<{ nomePiatto: string; quantita: number; prezzoUnitario: number }>
  totale: number
  numeroTavolo?: number
  nomeCliente?: string
  indirizzo?: string
}): string {
  const emoji = ordine.tipo === 'tavolo' ? '🍽️' : '🛵'
  const righe = ordine.voci
    .map(v => `  • ${v.quantita}x ${v.nomePiatto} (€${v.prezzoUnitario.toFixed(2)})`)
    .join('\n')

  let info = ''
  if (ordine.tipo === 'tavolo') {
    info = `Tavolo: ${ordine.numeroTavolo}`
  } else {
    info = `Cliente: ${ordine.nomeCliente}\nIndirizzo: ${ordine.indirizzo}`
  }

  return (
    `${emoji} NUOVO ORDINE #${ordine.numeroOrdine}\n` +
    `Tipo: ${ordine.tipo.toUpperCase()}\n` +
    `${info}\n\n` +
    `${righe}\n\n` +
    `TOTALE: €${ordine.totale.toFixed(2)}\n` +
    `Ora: ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
  )
}

export function messaggioNuovaPrenotazione(prenotazione: {
  nome: string
  telefono: string
  data: string
  fasciaOraria: string
  numerPersone: number
  note?: string
}): string {
  return (
    `📅 NUOVA PRENOTAZIONE\n` +
    `Nome: ${prenotazione.nome}\n` +
    `Tel: ${prenotazione.telefono}\n` +
    `Data: ${prenotazione.data}\n` +
    `Orario: ${prenotazione.fasciaOraria}\n` +
    `Persone: ${prenotazione.numerPersone}` +
    (prenotazione.note ? `\nNote: ${prenotazione.note}` : '')
  )
}
