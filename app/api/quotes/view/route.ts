import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID preventivo mancante' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configurazione Supabase mancante' }, { status: 500 })
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/quotes?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: 'viewed' }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Errore aggiornamento stato su Supabase' }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Errore API view:', err)
    return NextResponse.json({ error: err?.message || 'Errore server interno' }, { status: 500 })
  }
}