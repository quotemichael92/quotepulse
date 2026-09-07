import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Mappatura puntuale basata sulle colonne reali viste nel database Supabase
    const formattedQuotes = quotes.map((q) => ({
      id: q.id,
      clientName: q.client_name,
      clientEmail: q.client_email,
      amount: q.amount || 0, // Prende correttamente la colonna 'amount' (es. 1800) anziché 'total_amount' a 0
      status: q.status || 'PENDING',
      createdAt: q.created_at,
    }))

    return NextResponse.json({ success: true, quotes: formattedQuotes })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Error' }, { status: 500 })
  }
}