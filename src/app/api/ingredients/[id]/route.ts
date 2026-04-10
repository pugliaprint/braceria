/**
 * app/api/ingredients/[id]/route.ts
 * PUT    → modifica ingrediente o categoria (admin)
 * DELETE → elimina (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Ingredient, IngredientCategory } from '@/models/Ingredient'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const body = await req.json()
    const { tipo, ...dati } = body

    if (tipo === 'categoria') {
      const cat = await IngredientCategory.findByIdAndUpdate(params.id, dati, { new: true })
      return NextResponse.json(cat)
    }

    const ingrediente = await Ingredient.findByIdAndUpdate(params.id, dati, { new: true })
      .populate('categoria', 'nome icona')
    return NextResponse.json(ingrediente)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')

    if (tipo === 'categoria') {
      await IngredientCategory.findByIdAndDelete(params.id)
    } else {
      await Ingredient.findByIdAndDelete(params.id)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
