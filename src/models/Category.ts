/**
 * models/Category.ts
 * Categorie del menu (es: Antipasti, Braciolette, Grigliata Mista, Bevande...)
 */
import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  nome: string
  descrizione?: string
  icona?: string       // emoji o nome icona
  ordine: number       // per il sorting nel menu
  attiva: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
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
    icona: {
      type: String,
      default: '🍽️',
    },
    ordine: {
      type: Number,
      default: 0,
    },
    attiva: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', CategorySchema)
