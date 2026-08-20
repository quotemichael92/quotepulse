import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, clientEmail, description, basePrice, fomoHours, options } = body

    if (!clientName) {
      return NextResponse.json({ error: 'Nome cliente obbligatorio' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('quotes')
      .insert([
        {
          client_name: clientName,
          client_email: clientEmail,
          description: description,
          base_price: basePrice || 0,
          fomo_hours: fomoHours || 48,
          options: options || [],
          status: 'pending'
        }
      ])
      .select()

    if (error) {
      console.error('Errore inserimento Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const newQuote = data?.[0]
    return NextResponse.json({ success: true, quote: newQuote })

  } catch (err: any) {
    console.error('Errore API creazione preventivo:', err)
    return NextResponse.json({ error: err.message || 'Errore interno del server' }, { status: 500 })
  }
}