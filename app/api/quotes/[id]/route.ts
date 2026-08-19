import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Await dei parametri per Next.js App Router
    const { id } = await params

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !quote) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}