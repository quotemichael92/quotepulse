import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, clientEmail, projectDescription, amount } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configurazione mancante nelle variabili d\'ambiente' }, { status: 500 })
    }

    const numericAmount = Number(amount) || 0

    // Eseguiamo la chiamata POST a Supabase chiedendo esplicitamente il ritorno del record creato
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
        options: [],
        addons: [],
        features: []
      }),
    })

    const responseText = await res.text()

    if (!res.ok) {
      console.error('Errore Supabase:', responseText)
      return NextResponse.json({ error: `Errore Supabase: ${responseText}` }, { status: 400 })
    }

    const data = JSON.parse(responseText)
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Nessun dato restituito da Supabase dopo l\'inserimento.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, quote: data[0] }, { status: 200 })
  } catch (err: any) {
    console.error('Errore interno API:', err)
    return NextResponse.json({ error: err?.message || 'Errore server interno' }, { status: 500 })
  }
}