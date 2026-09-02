'use client';

import { createBrowserClient } from '@supabase/ssr';

interface CheckoutButtonProps {
  quoteId?: string;
  clientEmail?: string;
  amount?: number;
  priceId?: string;
}

export default function CheckoutButton({
  quoteId,
  clientEmail,
  amount,
  priceId,
}: CheckoutButtonProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCheckout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          clientEmail,
          amount,
          priceId,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Errore dal server:', data.error);
      }
    } catch (error) {
      console.error('Errore durante il checkout:', error);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-md transition-all cursor-pointer"
    >
      Paga Ora
    </button>
  );
}