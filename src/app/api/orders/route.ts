/**
 * app/api/orders/route.ts
 * GET  → lista ordini (admin/cucina)
 * POST → crea ordine (cliente - tavolo o delivery)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Order from '@/models/Order'
import Settings from '@/models/Settings'
import pusherServer, { PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher'
import { inviaNotificaWhatsApp, messaggioNuovoOrdine } from '@/lib/whatsapp'

// Genera numero ordine progressivo giornaliero
async function generaNumeroOrdine(): Promise<number> {
  const inizioGiorno = new Date()
  inizioGiorno.setHours(0, 0, 0, 0)

  const count = await Order.countDocuments({ createdAt: { $gte: inizioGiorno } })
  return count + 1
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const stato = searchParams.get('stato')
    const tipo = searchParams.get('tipo')
    const data = searchParams.get('data')
    const limit = parseInt(searchParams.get('limit') ?? '50')

    // Verifica PIN cucina o sessione admin
    const pinCucina = req.headers.get('x-cucina-pin')
    const session = await getServerSession(authOptions)

    if (!session && !pinCucina) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Valida PIN cucina se presente
    if (!session && pinCucina) {
      const settings = await Settings.findOne().lean() as any
      if (settings?.pinCucina !== pinCucina) {
        return NextResponse.json({ error: 'PIN non valido' }, { status: 401 })
      }
    }

    const filtro: any = {}
    if (stato) filtro.stato = stato
    if (tipo) filtro.tipo = tipo
    if (data) {
      const d = new Date(data)
      d.setHours(0, 0, 0, 0)
      const fine = new Date(data)
      fine.setHours(23, 59, 59, 999)
      filtro.createdAt = { $gte: d, $lte: fine }
    }

    const ordini = await Order.find(filtro)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json(ordini)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { tipo, voci, numeroTavolo, nomeCliente, telefonoCliente, indirizzo, note } = body

    // Validazione base
    if (!tipo || !voci?.length) {
      return NextResponse.json({ error: 'Dati ordine mancanti' }, { status: 400 })
    }
    if (tipo === 'tavolo' && !numeroTavolo) {
      return NextResponse.json({ error: 'Numero tavolo mancante' }, { status: 400 })
    }
    if (tipo === 'delivery' && (!nomeCliente || !telefonoCliente || !indirizzo)) {
      return NextResponse.json({ error: 'Dati consegna mancanti' }, { status: 400 })
    }

    // Controlla delivery attivo
    if (tipo === 'delivery') {
      const settings = await Settings.findOne().lean()
      if (!settings?.deliveryAttivo) {
        return NextResponse.json(
          { error: 'Il servizio di consegna è momentaneamente sospeso' },
          { status: 503 }
        )
      }
    }

    // Calcola totale
    const costoConsegna = tipo === 'delivery' ? 1.0 : 0
    const subtotale = voci.reduce(
      (acc: number, v: any) => acc + v.prezzoUnitario * v.quantita,
      0
    )
    const totale = subtotale + costoConsegna

    const numeroOrdine = await generaNumeroOrdine()

    const ordine = await Order.create({
      numeroOrdine,
      tipo,
      voci,
      totale,
      note,
      ...(tipo === 'tavolo' ? { numeroTavolo } : {}),
      ...(tipo === 'delivery'
        ? { nomeCliente, telefonoCliente, indirizzo, costoConsegna }
        : {}),
    })

    // ---- Notifica real-time alla cucina via Pusher ----
    await pusherServer.trigger(PUSHER_CHANNELS.CUCINA, PUSHER_EVENTS.NUOVO_ORDINE, {
      ordine: ordine.toObject(),
    })

    // ---- Notifica WhatsApp (non bloccante) ----
    inviaNotificaWhatsApp(
      messaggioNuovoOrdine({
        numeroOrdine,
        tipo,
        voci: voci.map((v: any) => ({
          nomePiatto: v.nomePiatto,
          quantita: v.quantita,
          prezzoUnitario: v.prezzoUnitario,
        })),
        totale,
        numeroTavolo,
        nomeCliente,
        indirizzo,
      })
    ).then(ok => {
      if (ok) Order.findByIdAndUpdate(ordine._id, { notificaInviata: true }).exec()
    })

    return NextResponse.json(ordine, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
