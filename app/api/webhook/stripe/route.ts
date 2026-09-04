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

    if (quoteId) {
      await supabase
        .from('quotes')
        .update({ status: 'PAID', paid_at: new Date().toISOString() })
        .eq('id', quoteId)
    }

    // Recupera la sessione espandendo la subscription per essere sicuri di avere tutti i dati
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['subscription', 'customer']
    })

    const subscription = fullSession.subscription as Stripe.Subscription | null

    if (subscription) {
      let validUserId = rawUserId && rawUserId !== 'not_provided' && rawUserId.length > 10 ? rawUserId : null

      if (!validUserId) {
        const customer = fullSession.customer as Stripe.Customer | null
        const customerEmail = fullSession.customer_email || customer?.email

        if (customerEmail) {
          const { data: listData } = await supabase.auth.admin.listUsers()
          const matchedUser = listData?.users?.find(u => u.email === customerEmail)
          if (matchedUser) {
            validUserId = matchedUser.id
          }
        }
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: validUserId,
          stripe_customer_id: typeof fullSession.customer === 'string' ? fullSession.customer : fullSession.customer?.id,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          created_at: new Date(subscription.created * 1000).toISOString(),
        }, {
          onConflict: 'stripe_subscription_id'
        })

      if (error) {
        console.error('Errore inserimento Supabase subscriptions:', error)
      } else {
        console.log(`Abbonamento ${subscription.id} salvato con successo per l'utente: ${validUserId}`)
      }
    } else {
      console.log('Nessuna subscription trovata nella sessione di Stripe.')
    }
  }

  return NextResponse.json({ received: true })
}