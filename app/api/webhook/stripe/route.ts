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
    const rawUserId = session.metadata?.userId
    
    // Verifica che l'userId sia un UUID valido (evita "not_provided" o stringhe casuali)
    const userId = rawUserId && rawUserId !== 'not_provided' && rawUserId.length > 10 ? rawUserId : null

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
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0]?.price.id,
            created_at: new Date(subscription.created * 1000).toISOString(),
          }, {
            onConflict: 'stripe_subscription_id'
          })

        console.log(`📦 ABBONAMENTO SALVATO SU SUPABASE! Subscription ID: ${subscription.id}`)
      }

      console.log(`🚀 UTENTE AGGIORNATO A PRO! User ID: ${userId}`)
    } else {
      console.log('⚠️ Nessun userId valido trovato nei metadata della sessione Stripe.')
    }
  }

  return NextResponse.json({ received: true })
}