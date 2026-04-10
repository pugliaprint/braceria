/**
 * models/Order.ts
 * Ordini: sia dal tavolo (QR) che delivery.
 * Gestisce panini personalizzati come voci speciali.
 */
import mongoose, { Schema, Document, Types } from 'mongoose'

// ---- Struttura di una voce ordine ----
export interface IOrderItem {
  tipo: 'piatto' | 'panino_personalizzato'

  // Se tipo === 'piatto'
  menuItemId?: Types.ObjectId
  nomePiatto: string

  // Se tipo === 'panino_personalizzato'
  ingredienti?: Array<{
    ingredienteId: Types.ObjectId
    nomeIngrediente: string
    categoria: string
    prezzoExtra: number
  }>

  quantita: number
  prezzoUnitario: number  // prezzo al momento dell'ordine (storico)
  note?: string           // es: "senza cipolla"
}

// ---- Ordine completo ----
export interface IOrder extends Document {
  numeroOrdine: number             // progressivo giornaliero
  tipo: 'tavolo' | 'delivery'
  stato: 'nuovo' | 'in_preparazione' | 'pronto' | 'consegnato' | 'annullato'

  // Solo per ordini al tavolo
  numeroTavolo?: number

  // Solo per delivery
  nomeCliente?: string
  telefonoCliente?: string
  indirizzo?: string
  costoConsegna?: number           // fisso 1.00€

  voci: IOrderItem[]
  totale: number
  note?: string

  notificaInviata: boolean         // WhatsApp inviato?
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    tipo: {
      type: String,
      enum: ['piatto', 'panino_personalizzato'],
      required: true,
    },
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    nomePiatto: { type: String, required: true, trim: true },
    ingredienti: [
      {
        ingredienteId: { type: Schema.Types.ObjectId, ref: 'Ingredient' },
        nomeIngrediente: { type: String, required: true },
        categoria: { type: String },
        prezzoExtra: { type: Number, default: 0 },
      },
    ],
    quantita: { type: Number, required: true, min: 1 },
    prezzoUnitario: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    numeroOrdine: { type: Number, required: true },
    tipo: {
      type: String,
      enum: ['tavolo', 'delivery'],
      required: true,
    },
    stato: {
      type: String,
      enum: ['nuovo', 'in_preparazione', 'pronto', 'consegnato', 'annullato'],
      default: 'nuovo',
    },
    numeroTavolo: { type: Number },
    nomeCliente: { type: String, trim: true },
    telefonoCliente: { type: String, trim: true },
    indirizzo: { type: String, trim: true },
    costoConsegna: { type: Number, default: 0 },
    voci: [OrderItemSchema],
    totale: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    notificaInviata: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Indici per query comuni
OrderSchema.index({ stato: 1, createdAt: -1 })
OrderSchema.index({ tipo: 1, createdAt: -1 })
OrderSchema.index({ numeroTavolo: 1, stato: 1 })

export default mongoose.models.Order ||
  mongoose.model<IOrder>('Order', OrderSchema)
