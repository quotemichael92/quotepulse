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
    
    // CASO A: Pagamento di un preventivo personalizzato
    const quoteId = session.metadata?.quoteId
    if (quoteId) {
      await supabase
        .from('quotes')
        .update({ status: 'PAID', paid_at: new Date().toISOString() })
        .eq('id', quoteId)

      console.log(`🎉 CONTRATTO CHIUSO! Pagamento ricevuto per preventivo ${quoteId}`)
    }

    // CASO B: Attivazione abbonamento mensile dalla dashboard
    const userId = session.client_reference_id || session.metadata?.userId
    const subscriptionId = session.subscription as string

    if (userId && userId !== 'not_provided' && userId !== 'guest_sub') {
      await supabase
        .from('profiles')
        .update({
          subscription_id: subscriptionId,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      console.log(`🚀 ABBONAMENTO ATTIVATO! Utente ${userId} registrato con successo.`)
    }
  }

  return NextResponse.json({ received: true })
}