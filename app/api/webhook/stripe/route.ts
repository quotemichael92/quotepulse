import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Stripe } from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-28.acacia' as any,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Errore firma webhook: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription?.id

    if (!subscriptionId) {
      return NextResponse.json({ received: true })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

    let userId = session.metadata?.supabase_user_id || session.client_reference_id

    if (!userId && customerId) {
      const customer = await stripe.customers.retrieve(customerId)
      if (!customer.deleted && customer.email) {
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const matchedUser = usersData?.users?.find(u => u.email === customer.email)
        if (matchedUser) {
          userId = matchedUser.id
        }
      }
    }

    const { error } = await supabase.rpc('handle_stripe_subscription', {
      p_user_id: userId || null,
      p_stripe_customer_id: customerId || null,
      p_stripe_subscription_id: subscription.id,
      p_status: subscription.status,
      p_price_id: subscription.items.data[0]?.price.id || null,
      p_created_at: new Date(subscription.created * 1000).toISOString(),
    })

    if (error) {
      console.error('Errore funzione SQL Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}