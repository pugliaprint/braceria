/**
 * app/api/settings/route.ts
 * GET → leggi configurazione (alcune parti pubbliche, alcune admin)
 * PUT → aggiorna configurazione (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Settings from '@/models/Settings'

// Campi visibili al pubblico (senza dati sensibili)
const CAMPI_PUBBLICI = {
  fasceOrarieDefault: 1,
  pranzoDomenicaAttivo: 1,
  fascePranzo: 1,
  deliveryAttivo: 1,
  costoConsegna: 1,
  nomeRistorante: 1,
  indirizzoRistorante: 1,
  telefonoRistorante: 1,
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const pubblico = searchParams.get('pubblico') === 'true'

    let settings
    if (pubblico) {
      settings = await Settings.findOne({}, CAMPI_PUBBLICI).lean() as any
    } else {
      const session = await getServerSession(authOptions)
      if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
      settings = await Settings.findOne().lean() as any
    }

    // Se non esistono settings, crea quelli di default
    if (!settings) {
      const nuoviSettings = await Settings.create({})
      settings = pubblico
        ? Object.fromEntries(
            Object.keys(CAMPI_PUBBLICI).map(k => [k, (nuoviSettings as any)[k]])
          )
        : nuoviSettings.toObject()
    }

    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const body = await req.json()

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, upsert: true }
    )

    return NextResponse.json(settings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
