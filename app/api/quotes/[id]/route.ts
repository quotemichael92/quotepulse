import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configurazione Supabase mancante' }, { status: 500 })
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/quotes?id=eq.${id}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    const text = await res.text()
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: text }, { status: 400 })
    }

    const data = JSON.parse(text)

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
    }

    return NextResponse.json({ success: true, quote: data[0] }, { status: 200 })
  } catch (err: any) {
    console.error('Errore interno API quote:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Errore server' }, { status: 500 })
  }
}