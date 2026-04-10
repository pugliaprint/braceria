/**
 * app/api/orders/[id]/route.ts
 * PUT → aggiorna stato ordine (cucina/admin)
 *       Invia evento Pusher agli altri client connessi
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Settings from '@/models/Settings'
import pusherServer, { PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    const pinCucina = req.headers.get('x-cucina-pin')
    const session = await getServerSession(authOptions)

    if (!session && !pinCucina) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await connectDB()

    if (!session && pinCucina) {
      const settings = await Settings.findOne().lean() as any
      if (settings?.pinCucina !== pinCucina) {
        return NextResponse.json({ error: 'PIN non valido' }, { status: 401 })
      }
    }

    const body = await req.json()
    const ordine = await Order.findByIdAndUpdate(id, body, { new: true })
    if (!ordine) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })

    await pusherServer.trigger(PUSHER_CHANNELS.CUCINA, PUSHER_EVENTS.AGGIORNAMENTO_STATO, {
      ordineId: id,
      nuovoStato: body.stato,
      ordine: ordine.toObject(),
    })

    return NextResponse.json(ordine)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function GET(_: NextRequest, { params }: RouteContext) {
  const { id } = await params
  try {
    await connectDB()
    const ordine = await Order.findById(id).lean()
    if (!ordine) return NextResponse.json({ error: 'Non trovato' }, { status: 404 })
    return NextResponse.json(ordine)
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}