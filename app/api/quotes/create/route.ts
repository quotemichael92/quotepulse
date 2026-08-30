import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkIsProPlan } from '@/lib/subscription'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      clientName, 
      clientEmail, 
      description, 
      basePrice, 
      fomoHours, 
      options, 
      videoPitch, 
      audioPitch, 
      removeBranding 
    } = body

    if (!clientName) {
      return NextResponse.json({ error: 'Nome cliente obbligatorio' }, { status: 400 })
    }

    // 1. Recupera l'utente autenticato dalla sessione corrente di Supabase
    const authHeader = req.headers.get('authorization')
    // Se usi i cookie di Supabase o il token Bearer, ricaviamo l'utente:
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''))

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Utente non autorizzato o sessione scaduta.' }, { status: 401 })
    }

    const userEmail = user.email
    const userId = user.id

    // 2. Verifica lo stato dell'abbonamento Pro su Stripe tramite la mail del professionista
    const isPro = await checkIsProPlan(userEmail)

    // 3. Controlli per gli utenti del piano Starter (!isPro)
    if (!isPro) {
      // CONTROLLO A: Limite di 5 preventivi attivi (filtrato specificamente per questo utente)
      const { count, error: countError } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) // <-- Fondamentale: conta solo i suoi preventivi

      if (!countError && count !== null && count >= 5) {
        return NextResponse.json(
          { 
            error: 'Hai raggiunto il limite di 5 preventivi attivi del piano Starter. Effettua l\'upgrade a Pro per creare Deal Room illimitate!' 
          }, 
          { status: 403 }
        )
      }

      // CONTROLLO B: Blocco delle funzionalità Pro
      const hasProFeatures = videoPitch || audioPitch || removeBranding
      if (hasProFeatures) {
        return NextResponse.json(
          { 
            error: 'Video pitch, note audio e rimozione del branding sono funzioni esclusive del piano Pro.' 
          }, 
          { status: 403 }
        )
      }
    }

    // 4. Salva il preventivo associandolo all'utente loggato
    const { data, error } = await supabase
      .from('quotes')
      .insert([
        {
          user_id: userId,
          client_name: clientName,
          client_email: clientEmail,
          description: description,
          base_price: basePrice || 0,
          fomo_hours: fomoHours || 48,
          options: options || [],
          video_pitch: isPro ? videoPitch : null,
          audio_pitch: isPro ? audioPitch : null,
          remove_branding: isPro ? removeBranding : false,
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