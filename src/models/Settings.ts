/**
 * models/Settings.ts
 * Configurazione globale dell'app.
 * C'è UN SOLO documento "settings" nel DB (singleton).
 */
import mongoose, { Schema, Document } from 'mongoose'

// Configurazione di una singola fascia oraria
export interface IFasciaOraria {
  ora: string       // es: "20:00"
  attiva: boolean
}

// Configurazione posti per una data specifica
export interface IPostiData {
  data: string      // formato: "YYYY-MM-DD"
  fasciaOraria: string
  posti: number
}

// Default posti per giorno della settimana e fascia oraria
export interface IPostiDefault {
  giornoSettimana: number   // 0=domenica, 1=lunedì, ... 6=sabato
  fasciaOraria: string
  posti: number
}

export interface ISettings extends Document {
  // ---- Orari ----
  fasceOrarieDefault: IFasciaOraria[]  // fasce comuni (cena)
  pranzoDomenicaAttivo: boolean        // domenica pranzo sì/no
  fascePranzo: IFasciaOraria[]         // fasce orario pranzo

  // ---- Posti ----
  postiDefaultPerFascia: IPostiDefault[]   // default settimanale
  postiEccezioni: IPostiData[]             // sovrascritture per data specifica

  // ---- Delivery ----
  deliveryAttivo: boolean
  costoConsegna: number         // default 1.00€

  // ---- WhatsApp ----
  whatsappNumero: string        // formato: 39XXXXXXXXXX
  whatsappApiKey: string        // CallMeBot API key
  whatsappAttivo: boolean       // attiva/disattiva notifiche

  // ---- Info ristorante ----
  nomeRistorante: string
  indirizzoRistorante: string
  telefonoRistorante: string

  // ---- Cucina ----
  pinCucina: string             // PIN 4 cifre per accesso dashboard cucina

  updatedAt: Date
}

const FasciaOrariaSchema = new Schema<IFasciaOraria>(
  {
    ora: { type: String, required: true },
    attiva: { type: Boolean, default: true },
  },
  { _id: false }
)

const PostiDefaultSchema = new Schema<IPostiDefault>(
  {
    giornoSettimana: { type: Number, required: true, min: 0, max: 6 },
    fasciaOraria: { type: String, required: true },
    posti: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const PostiDataSchema = new Schema<IPostiData>(
  {
    data: { type: String, required: true },
    fasciaOraria: { type: String, required: true },
    posti: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const SettingsSchema = new Schema<ISettings>(
  {
    fasceOrarieDefault: {
      type: [FasciaOrariaSchema],
      default: [
        { ora: '19:00', attiva: true },
        { ora: '19:30', attiva: true },
        { ora: '20:00', attiva: true },
        { ora: '20:30', attiva: true },
        { ora: '21:00', attiva: true },
        { ora: '21:30', attiva: true },
        { ora: '22:00', attiva: true },
      ],
    },
    pranzoDomenicaAttivo: { type: Boolean, default: false },
    fascePranzo: {
      type: [FasciaOrariaSchema],
      default: [
        { ora: '12:00', attiva: true },
        { ora: '12:30', attiva: true },
        { ora: '13:00', attiva: true },
        { ora: '13:30', attiva: true },
      ],
    },
    postiDefaultPerFascia: {
      type: [PostiDefaultSchema],
      default: [],
    },
    postiEccezioni: {
      type: [PostiDataSchema],
      default: [],
    },
    deliveryAttivo: { type: Boolean, default: true },
    costoConsegna: { type: Number, default: 1.0 },
    whatsappNumero: { type: String, default: '' },
    whatsappApiKey: { type: String, default: '' },
    whatsappAttivo: { type: Boolean, default: false },
    nomeRistorante: { type: String, default: 'Braceria Sannicandro' },
    indirizzoRistorante: { type: String, default: 'Sannicandro di Bari (BA)' },
    telefonoRistorante: { type: String, default: '' },
    pinCucina: { type: String, default: '1234' },
  },
  { timestamps: true }
)

export default mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema)
