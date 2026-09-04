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
      // Aggiorna il profilo utente
      await supabase
        .from('profiles')
        .update({ is_pro: true, updated_at: new Date().toISOString() })
        .eq('id', userId)

      // Registra o aggiorna l'abbonamento nella tabella 'subscriptions'
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id

      if (subscriptionId) {
        // Recupera i dettagli completi dell'abbonamento da Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0]?.price.id,
            quantity: subscription.items.data[0]?.quantity || 1,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            created_at: new Date(subscription.created * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          })

        console.log(`📦 ABBONAMENTO SALVATO SU SUPABASE! Subscription ID: ${subscription.id}`)
      }

      console.log(`🚀 UTENTE AGGIORNATO A PRO! User ID: ${userId}`)
    }
  }

  return NextResponse.json({ received: true })
}