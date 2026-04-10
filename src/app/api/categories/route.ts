/**
 * app/api/categories/route.ts
 * GET  → lista categorie menu
 * POST → crea nuova categoria (solo admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'

export async function GET() {
  try {
    await connectDB()
    const categorie = await Category.find({ attiva: true }).sort({ ordine: 1, nome: 1 }).lean() as any
    return NextResponse.json(categorie)
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
    const categoria = await Category.create(body)
    return NextResponse.json(categoria, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
