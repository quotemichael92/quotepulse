import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    const jsonBody = JSON.parse(body)
    event = jsonBody
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const quoteId = session.metadata?.quoteId
    const userId = session.metadata?.userId

    // 1. Se il pagamento è legato a un preventivo
    if (quoteId) {
      await supabase
        .from('quotes')
        .update({ status: 'PAID', paid_at: new Date().toISOString() })
        .eq('id', quoteId)

      console.log(`🎉 CONTRATTO CHIUSO! Pagamento ricevuto per preventivo ${quoteId}`)
    }

    // 2. Se il pagamento è legato all'abbonamento Pro dell'utente
    if (userId) {
      await supabase
        .from('profiles') // Modifica in 'users' se la tua tabella utenti ha un nome diverso
        .update({ is_pro: true, updated_at: new Date().toISOString() })
        .eq('id', userId)

      console.log(`🚀 UTENTE AGGIORNATO A PRO! User ID: ${userId}`)
    }
  }

  return NextResponse.json({ received: true })
}