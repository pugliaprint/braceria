/**
 * models/Reservation.ts
 * Prenotazioni tavolo dei clienti.
 */
import mongoose, { Schema, Document } from 'mongoose'

export interface IReservation extends Document {
  nome: string
  telefono: string
  data: Date              // giorno della prenotazione
  fasciaOraria: string    // es: "20:00"
  numerPersone: number
  note?: string           // eventuali note del cliente
  stato: 'confermata' | 'cancellata' | 'completata'
  notificaInviata: boolean // WhatsApp inviato?
  createdAt: Date
  updatedAt: Date
}

const ReservationSchema = new Schema<IReservation>(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: Date,
      required: true,
    },
    fasciaOraria: {
      type: String,
      required: true,
    },
    numerPersone: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    note: {
      type: String,
      trim: true,
    },
    stato: {
      type: String,
      enum: ['confermata', 'cancellata', 'completata'],
      default: 'confermata',
    },
    notificaInviata: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Indice per ricerche per data
ReservationSchema.index({ data: 1, fasciaOraria: 1 })

export default mongoose.models.Reservation ||
  mongoose.model<IReservation>('Reservation', ReservationSchema)
