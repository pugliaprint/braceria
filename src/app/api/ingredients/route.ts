/**
 * app/api/ingredients/route.ts
 * Gestione ingredienti panino builder + categorie ingredienti.
 * GET  → lista ingredienti con categorie
 * POST → crea ingrediente (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Ingredient, IngredientCategory } from '@/models/Ingredient'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') // 'ingredienti' | 'categorie'

    if (tipo === 'categorie') {
      const categorie = await IngredientCategory.find({ attiva: true })
        .sort({ ordine: 1 })
        .lean() as any
      return NextResponse.json(categorie)
    }

    // Default: ritorna ingredienti con categoria popolata
    const soloDisponibili = searchParams.get('disponibili') === 'true'
    const filtro: any = {}
    if (soloDisponibili) filtro.disponibile = true

    const ingredienti = await Ingredient.find(filtro)
      .populate('categoria', 'nome icona sceltaMinima sceltaMassima')
      .sort({ ordine: 1 })
      .lean() as any

    return NextResponse.json(ingredienti)
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const body = await req.json()
    const { tipo, ...dati } = body

    if (tipo === 'categoria') {
      const cat = await IngredientCategory.create(dati)
      return NextResponse.json(cat, { status: 201 })
    }

    const ingrediente = await Ingredient.create(dati)
    const popolato = await ingrediente.populate('categoria', 'nome icona')
    return NextResponse.json(popolato, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
