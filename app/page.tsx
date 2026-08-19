'use client';

export default function Home() {
  const handleCheckout = async (priceId: string) => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Errore durante il checkout:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">QuotePulse Subscriptions</h1>
      <div className="flex gap-8">
        {/* Card Starter */}
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 text-center w-64">
          <h2 className="text-2xl font-bold text-gray-800">Starter</h2>
          <p className="text-3xl font-extrabold my-4 text-gray-900">
            €29<span className="text-sm text-gray-500">/mese</span>
          </p>
          <button
            onClick={() => handleCheckout('price_1TyBxsGc2QPdKxT7HMWzVJHs')}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Abbonati a Starter
          </button>
        </div>

        {/* Card Pro */}
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 text-center w-64">
          <h2 className="text-2xl font-bold text-gray-800">Pro</h2>
          <p className="text-3xl font-extrabold my-4 text-gray-900">
            €59<span className="text-sm text-gray-500">/mese</span>
          </p>
          <button
            onClick={() => handleCheckout('price_1TyC2LGc2QPdKxT7CPKm6oPB')}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Abbonati a Pro
          </button>
        </div>
      </div>
    </main>
  );
}