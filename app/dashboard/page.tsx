'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectDescription, setProjectDescription] = useState('Sviluppo piattaforma web professionale & Integrazione Dashboard.');
  const [amount, setAmount] = useState(2200);
  const [timerFomo, setTimerFomo] = useState(48);
  const [options, setOptions] = useState<string[]>(['Core App & Dashboard', 'Integrazione Stripe Checkout']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleOption = (opt: string) => {
    setOptions(prev => 
      prev.includes(opt) ? prev.filter(item => item !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          projectDescription,
          amount,
          timerFomo,
          options
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione del preventivo');
      }

      if (data.success && data.quote && data.quote.id) {
        // Reindirizza al preventivo reale con UUID di Supabase!
        router.push(`/p/${data.quote.id}`);
      } else {
        throw new Error('Risposta non valida dal server');
      }
    } catch (err: any) {
      setError(err.message || 'Errore imprevisto');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090d16] text-white p-6 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Banner FOMO */}
        <div className="bg-[#111827] border border-blue-900/50 rounded-xl p-4 mb-8 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔥</span>
            <span className="text-sm md:text-base font-medium text-blue-200">Offerta a tempo: blocco slot prioritario e condizioni garantite</span>
          </div>
          <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
            {timerFomo}:00:00
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Crea Preventivo Interattivo</h1>
        <p className="text-gray-400 mb-8">Configura i parametri del progetto e genera il link di trattativa reale.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#111827]/80 backdrop-blur border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Cliente</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="es. Mario Rossi"
                className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Cliente</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="mario@esempio.com"
                className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrizione Progetto</label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Budget Slider */}
          <div className="bg-[#1f2937]/50 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Target Budget Stimato</span>
              <span className="text-2xl font-extrabold text-blue-400">€{amount}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Moduli e Opzioni interattive */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Moduli e Add-on Inclusi</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Core App & Dashboard', 'Integrazione Stripe Checkout', 'Supporto Prioritario 24/7', 'Ottimizzazione SEO & Performance'].map((opt) => {
                const isSelected = options.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => handleToggleOption(opt)}
                    className={`cursor-pointer p-3 rounded-xl border text-sm font-medium transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 text-blue-300' 
                        : 'bg-[#1f2937]/30 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span>✓ {opt}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-600'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Generazione in corso...' : 'Genera Preventivo Reale & Apri Deal Room'}
          </button>
        </form>
      </div>
    </main>
  );
}