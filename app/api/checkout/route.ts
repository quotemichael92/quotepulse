import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientEmail, amount } = body;
    
    // Recupera e pulisce l'ID in modo sicuro: se manca, usa un fallback
    const quoteId = body.quoteId && body.quoteId !== 'undefined' ? body.quoteId : 'default';

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acconto Preventivo',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: clientEmail || undefined,
      success_url: `${origin}/p/${quoteId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/p/${quoteId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}