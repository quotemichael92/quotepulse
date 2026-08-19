import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { id } = await req.json()

    // SE È DEMO, NON INTERROGARE SUPABASE
    if (id && id.toString().startsWith('demo-')) {
      return NextResponse.json({ success: true, isDemo: true })
    }

    // ... Il resto del tuo codice Supabase esistente rimane sotto ...

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}