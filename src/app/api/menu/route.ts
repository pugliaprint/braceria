/**
 * app/api/menu/route.ts
 * GET  → lista piatti (con categoria popolata)
 * POST → crea nuovo piatto (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import MenuItem from '@/models/MenuItem'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const soloDisponibili = searchParams.get('disponibili') === 'true'

    const filtro: any = {}
    if (soloDisponibili) filtro.disponibile = true

    const piatti = await MenuItem.find(filtro)
      .populate('categoria', 'nome icona')
      .sort({ ordine: 1, nome: 1 })
      .lean()

    return NextResponse.json(piatti)
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
    const piatto = await MenuItem.create(body)
    const popolato = await piatto.populate('categoria', 'nome icona')
    return NextResponse.json(popolato, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
