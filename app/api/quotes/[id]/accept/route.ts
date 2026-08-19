import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || id.startsWith('demo-')) {
      return NextResponse.json({ success: true, message: 'Demo accept acknowledged' })
    }

    const { data, error } = await supabase
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase accept update error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('API Accept Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 })
  }
}