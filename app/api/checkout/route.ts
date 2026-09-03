import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientEmail, amount, quoteId, priceId, userId } = body;

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let sessionParams: Stripe.Checkout.SessionCreateParams;

    // CASO 1: Abbonamento mensile
    if (priceId) {
      sessionParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard?success=true`,
        cancel_url: `${origin}/dashboard?canceled=true`,
        client_reference_id: userId || 'guest_sub',
        metadata: {
          userId: userId || 'not_provided',
        },
      };
    } 
    // CASO 2: Pagamento preventivo personalizzato
    else {
      if (!quoteId || quoteId === 'undefined' || quoteId === 'null' || String(quoteId).trim() === '' || quoteId === 'default') {
        return NextResponse.json(
          { error: 'ID preventivo non valido o mancante. Impossibile procedere con il pagamento.' },
          { status: 400 }
        );
      }

      sessionParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Acconto Preventivo',
              },
              unit_amount: Math.round((Number(amount) || 0) * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: clientEmail || undefined,
        success_url: `${origin}/p/${quoteId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/p/${quoteId}`,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}