'use client';

interface CheckoutButtonProps {
  quoteId: string;
  clientEmail?: string;
  amount: number;
}

export default function CheckoutButton({
  quoteId,
  clientEmail,
  amount,
}: CheckoutButtonProps) {
  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          clientEmail,
          amount,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Errore durante il checkout:', error);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
    >
      Paga Ora
    </button>
  );
}