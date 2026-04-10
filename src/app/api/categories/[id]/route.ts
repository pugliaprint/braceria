/**
 * app/api/categories/[id]/route.ts
 * PUT    → modifica categoria (admin)
 * DELETE → elimina categoria (admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Category from '@/models/Category'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await connectDB()
    const body = await req.json()
    const categoria = await Category.findByIdAndUpdate(id, body, { new: true })
    if (!categoria) return NextResponse.json({ error: 'Non trovata' }, { status: 404 })
    return NextResponse.json(categoria)
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
    await Category.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Errore server' }, { status: 500 })
  }
}