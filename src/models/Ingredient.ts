/**
 * models/Ingredient.ts
 * Ingredienti per il Panino Builder, divisi per categoria.
 */
import mongoose, { Schema, Document } from 'mongoose'

// ---- Categoria Ingrediente ----
export interface IIngredientCategory extends Document {
  nome: string
  descrizione?: string
  icona?: string
  ordine: number
  sceltaMinima: number    // minimo da scegliere (0 = opzionale, 1 = obbligatorio)
  sceltaMassima: number   // massimo selezionabile (1 = scelta singola, N = multiplo)
  attiva: boolean
}

const IngredientCategorySchema = new Schema<IIngredientCategory>(
  {
    nome: { type: String, required: true, trim: true },
    descrizione: { type: String, trim: true },
    icona: { type: String, default: '🧅' },
    ordine: { type: Number, default: 0 },
    sceltaMinima: { type: Number, default: 0 },
    sceltaMassima: { type: Number, default: 10 },
    attiva: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const IngredientCategory =
  mongoose.models.IngredientCategory ||
  mongoose.model<IIngredientCategory>('IngredientCategory', IngredientCategorySchema)

// ---- Ingrediente ----
export interface IIngredient extends Document {
  nome: string
  categoria: mongoose.Types.ObjectId
  prezzoExtra: number   // 0 = incluso, > 0 = costo aggiuntivo
  disponibile: boolean
  ordine: number
}

const IngredientSchema = new Schema<IIngredient>(
  {
    nome: { type: String, required: true, trim: true },
    categoria: {
      type: Schema.Types.ObjectId,
      ref: 'IngredientCategory',
      required: true,
    },
    prezzoExtra: { type: Number, default: 0, min: 0 },
    disponibile: { type: Boolean, default: true },
    ordine: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Ingredient =
  mongoose.models.Ingredient ||
  mongoose.model<IIngredient>('Ingredient', IngredientSchema)
