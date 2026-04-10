/**
 * models/MenuItem.ts
 * Piatti del menu con prezzi, descrizioni e foto.
 */
import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IMenuItem extends Document {
  nome: string
  descrizione?: string
  prezzo: number           // in euro, es: 12.50
  categoria: Types.ObjectId
  immagine?: string        // URL immagine (Cloudinary o placeholder)
  disponibile: boolean     // l'admin può disattivare temporaneamente
  evidenziato: boolean     // messo in risalto nel menu (es: "Il nostro must")
  allergeni?: string[]     // lista allergeni (opzionale)
  ordine: number           // sorting nella categoria
  createdAt: Date
  updatedAt: Date
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    descrizione: {
      type: String,
      trim: true,
    },
    prezzo: {
      type: Number,
      required: true,
      min: 0,
    },
    categoria: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    immagine: {
      type: String,
    },
    disponibile: {
      type: Boolean,
      default: true,
    },
    evidenziato: {
      type: Boolean,
      default: false,
    },
    allergeni: [{ type: String }],
    ordine: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>('MenuItem', MenuItemSchema)
