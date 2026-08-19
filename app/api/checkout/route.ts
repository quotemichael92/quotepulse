import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
})

export async function POST(req: Request) {
  try {
    const { quoteId, amount, title, clientEmail } = await req.json()

    // Crea la sessione di checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: title || 'Acconto Preventivo',
            },
            unit_amount: Math.round((amount || 100) * 100), // importo in centesimi
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: clientEmail && clientEmail.includes('@') ? clientEmail : undefined,
      success_url: `${req.headers.get('origin')}/p/${quoteId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/p/${quoteId}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}