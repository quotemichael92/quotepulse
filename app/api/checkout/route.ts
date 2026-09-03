import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientEmail, amount, quoteId, priceId, userId: bodyUserId } = body;

    let userId = bodyUserId;

    // Se il frontend non passa il userId, lo ricaviamo in sicurezza dai cookie
    if (!userId || userId.trim() === '') {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {}
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let sessionParams: Stripe.Checkout.SessionCreateParams;

    // CASO 1: Abbonamento mensile (Starter / Pro tramite priceId)
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
        client_reference_id: userId || undefined,
        metadata: {
          userId: userId || '',
        },
      };
    } 
    // CASO 2: Pagamento preventivo personalizzato (tramite amount e quoteId)
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