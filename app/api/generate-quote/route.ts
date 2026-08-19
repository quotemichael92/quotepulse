import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, clientEmail, projectDescription, amount } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configurazione mancante' }, { status: 500 })
    }

    // Chiamata REST diretta a Supabase (evita del tutto i bug dell'SDK sulle nuove chiavi API)
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
        description: projectDescription,
        amount: Number(amount) || 0,
        status: 'pending',
      }),
    })

    if (!res.ok) {
      const errData = await res.json()
      return NextResponse.json({ error: errData.message || 'Errore salvataggio Supabase' }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, quote: data[0] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Errore server' }, { status: 500 })
  }
}