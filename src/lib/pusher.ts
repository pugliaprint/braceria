/**
 * lib/pusher.ts
 * Client Pusher lato server per inviare eventi real-time alla cucina.
 * Canali usati:
 *   - "cucina" → eventi ordini in tempo reale
 */
import Pusher from 'pusher'

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? 'eu',
  useTLS: true,
})

export default pusherServer

// Nomi eventi standardizzati
export const PUSHER_EVENTS = {
  NUOVO_ORDINE: 'nuovo-ordine',
  AGGIORNAMENTO_STATO: 'aggiornamento-stato',
  ORDINE_ANNULLATO: 'ordine-annullato',
} as const

export const PUSHER_CHANNELS = {
  CUCINA: 'cucina',
} as const
