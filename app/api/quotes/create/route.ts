import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clientName, clientEmail, description, basePrice, fomoHours } = body

    // Tentativo di inserimento reale su Supabase
    const { data, error } = await supabase
      .from('quotes')
      .insert([
        {
          client_name: clientName,
          client_email: clientEmail,
          description: description || '',
          base_price: Number(basePrice) || 0,
          fomo_hours: Number(fomoHours) || 48,
          status: 'PENDING'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("Errore Supabase dettagliato:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, quote: data })
  } catch (err: any) {
    console.error("Errore interno del server:", err)
    return NextResponse.json(
      { success: false, error: err.message || 'Errore sconosciuto' },
      { status: 500 }
    )
  }
}