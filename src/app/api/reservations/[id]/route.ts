/**
 * app/api/reservations/[id]/route.ts
 * PUT    → aggiorna stato prenotazione (admin)
 * DELETE → cancella prenotazione (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Reservation from '@/models/Reservation'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const body = await req.json()
    const prenotazione = await Reservation.findByIdAndUpdate(params.id, body, { new: true })
    if (!prenotazione) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    return NextResponse.json(prenotazione)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    await Reservation.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}
