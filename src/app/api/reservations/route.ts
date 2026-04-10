/**
 * app/api/reservations/route.ts
 * GET  → lista prenotazioni (admin) o disponibilità (cliente)
 * POST → crea prenotazione (cliente)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Reservation from '@/models/Reservation'
import Settings from '@/models/Settings'
import { inviaNotificaWhatsApp, messaggioNuovaPrenotazione } from '@/lib/whatsapp'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')

    // ---- Disponibilità per data/fascia (pubblico) ----
    if (tipo === 'disponibilita') {
      const dataStr = searchParams.get('data')
      if (!dataStr) return NextResponse.json({ error: 'Data richiesta' }, { status: 400 })

      const data = parseISO(dataStr)
      const settings = await Settings.findOne().lean() as any

      if (!settings) return NextResponse.json({ error: 'Configurazione mancante' }, { status: 500 })

      // Determina fasce orarie per questa data
      const giornoSettimana = data.getDay() // 0=dom, 6=sab
      const isDomenica = giornoSettimana === 0

      let fasce: string[] = []

      // Fasce cena
      const fasceCena = settings.fasceOrarieDefault
        .filter(f => f.attiva)
        .map(f => f.ora)
      fasce = [...fasceCena]

      // Fasce pranzo (solo domenica se attivo)
      if (isDomenica && settings.pranzoDomenicaAttivo) {
        const fascePranzoAttive = settings.fascePranzo
          .filter(f => f.attiva)
          .map(f => f.ora)
        fasce = [...fascePranzoAttive, ...fasceCena]
      }

      // Calcola posti per ogni fascia
      const disponibilita = await Promise.all(
        fasce.map(async (fascia) => {
          // Controlla eccezioni specifiche per data
          const eccezione = settings.postiEccezioni.find(
            e => e.data === dataStr && e.fasciaOraria === fascia
          )

          // Poi default settimanale
          const defaultFascia = settings.postiDefaultPerFascia.find(
            d => d.giornoSettimana === giornoSettimana && d.fasciaOraria === fascia
          )

          const postiTotali = eccezione?.posti ?? defaultFascia?.posti ?? 40

          // Conta posti già prenotati
          const prenotazioni = await Reservation.aggregate([
            {
              $match: {
                data: { $gte: startOfDay(data), $lte: endOfDay(data) },
                fasciaOraria: fascia,
                stato: 'confermata',
              },
            },
            { $group: { _id: null, totale: { $sum: '$numerPersone' } } },
          ])

          const postiOccupati = prenotazioni[0]?.totale ?? 0
          const postiLiberi = Math.max(0, postiTotali - postiOccupati)

          return {
            fascia,
            postiTotali,
            postiLiberi,
            disponibile: postiLiberi > 0,
          }
        })
      )

      return NextResponse.json(disponibilita)
    }

    // ---- Lista prenotazioni (admin) ----
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const dataFiltro = searchParams.get('data')
    const stato = searchParams.get('stato')

    const filtro: any = {}
    if (dataFiltro) {
      const d = parseISO(dataFiltro)
      filtro.data = { $gte: startOfDay(d), $lte: endOfDay(d) }
    }
    if (stato) filtro.stato = stato

    const prenotazioni = await Reservation.find(filtro)
      .sort({ data: 1, fasciaOraria: 1, createdAt: 1 })
      .lean()

    return NextResponse.json(prenotazioni)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { nome, telefono, data: dataStr, fasciaOraria, numerPersone, note } = body

    // Validazione campi obbligatori
    if (!nome || !telefono || !dataStr || !fasciaOraria || !numerPersone) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const data = parseISO(dataStr)

    // Verifica disponibilità posti
    const settings = await Settings.findOne().lean() as any
    if (!settings) return NextResponse.json({ error: 'Configurazione mancante' }, { status: 500 })

    const giornoSettimana = data.getDay()
    const eccezione = settings.postiEccezioni.find(
      e => e.data === dataStr && e.fasciaOraria === fasciaOraria
    )
    const defaultFascia = settings.postiDefaultPerFascia.find(
      d => d.giornoSettimana === giornoSettimana && d.fasciaOraria === fasciaOraria
    )
    const postiTotali = eccezione?.posti ?? defaultFascia?.posti ?? 40

    const prenotazioniEsistenti = await Reservation.aggregate([
      {
        $match: {
          data: { $gte: startOfDay(data), $lte: endOfDay(data) },
          fasciaOraria,
          stato: 'confermata',
        },
      },
      { $group: { _id: null, totale: { $sum: '$numerPersone' } } },
    ])

    const postiOccupati = prenotazioniEsistenti[0]?.totale ?? 0
    const postiLiberi = postiTotali - postiOccupati

    if (numerPersone > postiLiberi) {
      return NextResponse.json(
        { error: `Posti insufficienti. Disponibili: ${postiLiberi}` },
        { status: 409 }
      )
    }

    // Crea prenotazione
    const prenotazione = await Reservation.create({
      nome,
      telefono,
      data,
      fasciaOraria,
      numerPersone,
      note,
    })

    // Notifica WhatsApp (non bloccante)
    inviaNotificaWhatsApp(
      messaggioNuovaPrenotazione({
        nome,
        telefono,
        data: format(data, 'dd/MM/yyyy'),
        fasciaOraria,
        numerPersone,
        note,
      })
    ).then(ok => {
      if (ok) Reservation.findByIdAndUpdate(prenotazione._id, { notificaInviata: true }).exec()
    })

    return NextResponse.json(prenotazione, { status: 201 })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
