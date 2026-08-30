import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-28.acacia' as any,
});

export async function checkIsProPlan(customerEmailOrId: string): Promise<boolean> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 5,
    });

    const proPriceId = 'price_1TyC2LGc2QPdKxT7CPKm6oPB';
    const hasPro = subscriptions.data.some(sub => 
      sub.items.data.some(item => item.price.id === proPriceId)
    );

    return hasPro;
  } catch (err) {
    console.error('Errore durante la verifica dell\'abbonamento:', err);
    return false;
  }
}