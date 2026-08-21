import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      clientName, 
      clientEmail, 
      projectDescription, 
      amount, 
      timerFomo, 
      options 
    } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configurazione Supabase mancante' }, { status: 500 })
    }

    const numericAmount = Number(amount) || 0
    const fomoHours = Number(timerFomo) || 48
    const expiresAt = new Date(Date.now() + fomoHours * 60 * 60 * 1000).toISOString()

    const res = await fetch(`${supabaseUrl}/rest/v1/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        client_name: clientName,
        client_email: clientEmail,
        title: `Preventivo per ${clientName}`,
        description: projectDescription || 'Servizio professionale',
        base_price: numericAmount,
        base_amount: numericAmount,
        status: 'PENDING',
        options: Array.isArray(options) ? options : [],
        addons: [],
        features: [],
        expires_at: expiresAt
      }),
    })

    const responseText = await res.text()

    if (!res.ok) {
      console.error('Errore Supabase:', responseText)
      return NextResponse.json({ error: `Errore Supabase: ${responseText}` }, { status: 400 })
    }

    const data = JSON.parse(responseText)
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Nessun dato restituito da Supabase.' }, { status: 500 })
    }

    console.log("Preventivo creato con successo ID reale:", data[0].id)

    return NextResponse.json({ success: true, quote: data[0] }, { status: 200 })
  } catch (err: any) {
    console.error('Errore interno API:', err)
    return NextResponse.json({ error: err?.message || 'Errore server interno' }, { status: 500 })
  }
}