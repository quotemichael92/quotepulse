import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    let userEmail = 'professionista@quotepulse.it'
    const { data: { user } } = await supabase.auth.getUser()

    if (user && user.email) {
      userEmail = user.email
    } else {
      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        const { data: { user: tokenUser } } = await supabase.auth.getUser(token)
        if (tokenUser && tokenUser.email) {
          userEmail = tokenUser.email
        }
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const numericAmount = Number(amount) || 0
    const fomoHours = Number(timerFomo) || 48
    const expiresAt = new Date(Date.now() + fomoHours * 60 * 60 * 1000).toISOString()

    const res = await fetch(`${supabaseUrl}/rest/v1/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        client_name: clientName,
        client_email: clientEmail,
        user_email: userEmail,
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

    const quoteId = data[0].id
    const dealRoomUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/p/${quoteId}`

    // Invio della email al cliente tramite Resend
    if (clientEmail) {
      try {
        await resend.emails.send({
          from: 'QuotePulse <onboarding@resend.dev>', // Sostituisci con il tuo dominio verificato se configurato
          to: [clientEmail],
          subject: `La tua Deal Room è pronta: Proposta per ${clientName}`,
          html: `
            <div style="font-family: sans-serif; background-color: #05070b; color: #ffffff; padding: 30px; border-radius: 12px;">
              <h2 style="color: #a855f7;">Nuova Proposta Commerciale</h2>
              <p>Ciao <strong>${clientName}</strong>,</p>
              <p>Abbiamo preparato la Deal Room dedicata al tuo progetto. Puoi visionare i dettagli, i moduli e procedere all'approvazione al link sottostante:</p>
              <div style="margin: 30px 0;">
                <a href="${dealRoomUrl}" style="background: linear-gradient(to right, #9333ea, #2563eb); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Apri la Deal Room</a>
              </div>
              <p style="color: #9ca3af; font-size: 12px;">Questo link scadrà tra ${fomoHours} ore.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('Errore invio email Resend:', emailErr)
        // Non blocchiamo la risposta se l'invio mail fallisce, ma lo loggiamo
      }
    }

    return NextResponse.json({ success: true, quote: data[0] }, { status: 200 })
  } catch (err: any) {
    console.error('Errore interno API:', err)
    return NextResponse.json({ error: err?.message || 'Errore server interno' }, { status: 500 })
  }
}