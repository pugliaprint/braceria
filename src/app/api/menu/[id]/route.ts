/**
 * app/api/menu/[id]/route.ts
 * GET    → singolo piatto
 * PUT    → modifica piatto (admin)
 * DELETE → elimina piatto (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import MenuItem from '@/models/MenuItem'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    await connectDB()
    const piatto = await MenuItem.findById(id).populate('categoria', 'nome icona').lean()
    if (!piatto) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
    return NextResponse.json(piatto)
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const body = await req.json()
    const piatto = await MenuItem.findByIdAndUpdate(id, body, { new: true }).populate('categoria', 'nome icona')
    if (!piatto) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
    return NextResponse.json(piatto)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    await MenuItem.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}