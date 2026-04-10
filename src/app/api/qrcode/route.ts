/**
 * app/api/qrcode/route.ts
 * GET /api/qrcode?tavolo=5
 * Genera e ritorna il QR code per un tavolo (solo admin).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generaQRCodeTavolo } from '@/lib/qrcode'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tavolo = parseInt(searchParams.get('tavolo') ?? '0')

  if (!tavolo || tavolo <= 0) {
    return NextResponse.json({ error: 'Numero tavolo non valido' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`
  const dataUrl = await generaQRCodeTavolo(tavolo, baseUrl)

  return NextResponse.json({ dataUrl, tavolo, url: `${baseUrl}/ordine/${tavolo}` })
}
