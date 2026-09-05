'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    setLoadingPlan(planName);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error('Errore durante il checkout:', err);
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden">
      
      {/* Sfumature decorative di sfondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header / Nav */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
          <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">QuotePulse</span>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-xs md:text-sm bg-[#111827] hover:bg-[#1f2937] border border-gray-800 px-4 py-2 rounded-xl transition text-gray-300 font-medium shadow-md cursor-pointer"
        >
          Accedi alla Dashboard →
        </button>
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center z-10 space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-400">
          🚀 Next-Gen Deal Rooms per Freelance & Agenzie
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          QuotePulse Subscriptions
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
          Scegli il piano ideale per chiudere più contratti, azzerare i clienti fantasma e gestire preventivi interattivi.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10 mb-16">
        
        {/* Card Starter */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 flex flex-col justify-between shadow-2xl hover:border-gray-700 transition duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Starter</h2>
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full font-mono">Base</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Ideale per professionisti che vogliono digitalizzare i propri preventivi.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl md:text-5xl font-extrabold font-mono text-white">€29</span>
              <span className="text-gray-400 text-sm">/mese</span>
            </div>

            <ul className="space-y-3.5 text-sm text-gray-300 mb-8">
              <li className="flex items-center gap-2.5">
                <span className="text-purple-400 font-bold">✓</span> Preventivi Interattivi essenziali
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-purple-400 font-bold">✓</span> Firma Digitale Canvas integrata
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-purple-400 font-bold">✓</span> Tracciamento apertura Deal Room
              </li>
              <li className="flex items-center gap-2.5 text-gray-500">
                <span className="font-bold">✕</span> Note Audio/Video & Pitch personalizzati
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('price_1TyBxsGc2QPdKxT7HMWzVJHs', 'Starter')}
            disabled={loadingPlan !== null}
            className="w-full bg-[#1f2937] hover:bg-gray-700 text-white font-semibold py-3.5 rounded-2xl transition duration-200 border border-gray-700 text-sm shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loadingPlan === 'Starter' ? 'Reindirizzamento a Stripe...' : 'Abbonati a Starter'}
          </button>
        </div>

        {/* Card Pro (Evidenziata) */}
        <div className="bg-gradient-to-b from-[#191029] to-[#111827] backdrop-blur-xl border-2 border-purple-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative hover:border-purple-400 transition duration-300">
          
          <div className="absolute -top-3.5 right-8 bg-purple-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg">
            ⭐ Più Scelto / Consigliato
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-200">Pro</h2>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-mono border border-purple-500/30">Full Power</span>
            </div>
            <p className="text-gray-300 text-sm mb-6">Per chi vuole un motore di vendita e trattativa imbattibile.</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl md:text-5xl font-extrabold font-mono text-purple-400">€59</span>
              <span className="text-gray-400 text-sm">/mese</span>
            </div>

            <ul className="space-y-3.5 text-sm text-gray-200 mb-8">
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span> Deal Rooms illimitate e interattive
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span> Firma Canvas + Audio/Video Pitch note
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span> Protezione avanzata contro richieste extra
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span> Rimozione branding e White-Label avanzato
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('price_1TyC2LGc2QPdKxT7CPKm6oPB', 'Pro')}
            disabled={loadingPlan !== null}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-purple-600/30 transition duration-200 text-sm disabled:opacity-50 cursor-pointer"
          >
            {loadingPlan === 'Pro' ? 'Reindirizzamento a Stripe...' : 'Abbonati a Pro'}
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 z-10">
        © 2026 QuotePulse. Tutti i diritti riservati. Protetto da crittografia end-to-end.
      </div>
    </main>
  );
}