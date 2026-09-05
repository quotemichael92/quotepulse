'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Quote {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: 'PENDING' | 'VIEWED' | 'SIGNED';
  createdAt: string;
  timerFomo: number;
}

export default function DashboardOverviewPage() {
  const searchParams = useSearchParams();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/quotes');
        if (!res.ok) throw new Error('Errore nel recupero dei preventivi');
        const data = await res.json();
        
        if (data.quotes && data.quotes.length > 0) {
          setQuotes(data.quotes);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Ignoriamo l'errore dell'API e controlliamo il localStorage
      }

      const localQuotes = localStorage.getItem('quotepulse_deals');
      if (localQuotes) {
        try {
          setQuotes(JSON.parse(localQuotes));
        } catch (e) {
          setQuotes([]);
        }
      } else {
        setQuotes([]);
      }
      
      setLoading(false);
    };

    fetchQuotes();
  }, []);

  const totalPipeline = quotes.reduce((acc, q) => acc + q.amount, 0);
  const signedCount = quotes.filter(q => q.status === 'SIGNED').length;

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Banner di successo post-pagamento Stripe */}
        {showSuccessBanner && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between text-sm shadow-lg">
            <div className="flex items-center gap-2">
              <span>🎉</span>
              <span><strong>Abbonamento attivato con successo!</strong> Il tuo account è ora operativo. Benvenuto in QuotePulse.</span>
            </div>
            <button 
              onClick={() => setShowSuccessBanner(false)}
              className="text-emerald-400 hover:text-white font-bold px-2 py-1 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-[#111827] to-blue-950/40 border border-purple-900/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-blue-400 bg-clip-text text-transparent">
              QuotePulse Dashboard
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              Panoramica generale delle Deal Room, stato trattative e conversioni in tempo reale.
            </p>
          </div>
          
          <Link
            href="/dashboard/new"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold px-5 py-3 rounded-xl shadow-xl shadow-purple-600/30 transition duration-200 text-sm flex items-center gap-2"
          >
            <span>+</span> Crea Nuovo Preventivo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#111827]/80 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Preventivi Totali</span>
            <div className="text-3xl font-extrabold text-white font-mono mt-2">{quotes.length}</div>
          </div>
          <div className="bg-[#111827]/80 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Valore Pipeline</span>
            <div className="text-3xl font-extrabold text-purple-400 font-mono mt-2">€{totalPipeline.toLocaleString()}</div>
          </div>
          <div className="bg-[#111827]/80 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Deal Firmati / Chiusi</span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-2">{signedCount}</div>
          </div>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
            <span>📋</span> Storico Trattative & Deal Rooms
          </h3>

          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Caricamento preventivi in corso...</div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-gray-400 text-sm">Nessun preventivo generato finora.</p>
              <Link
                href="/dashboard/new"
                className="inline-block text-xs font-semibold text-purple-400 hover:underline"
              >
                Crea il tuo primo preventivo ora →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-gray-800 text-xs uppercase text-gray-400 font-semibold bg-[#182234]/40">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Cliente</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Valore</th>
                    <th className="py-3 px-4">Stato</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-[#182234]/30 transition">
                      <td className="py-4 px-4 font-medium text-white">{quote.clientName}</td>
                      <td className="py-4 px-4 text-gray-400 text-xs">{quote.clientEmail}</td>
                      <td className="py-4 px-4 font-mono font-bold text-purple-300">€{quote.amount.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        {quote.status === 'SIGNED' ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-medium">
                            Firmato ✓
                          </span>
                        ) : quote.status === 'VIEWED' ? (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-medium">
                            Visualizzato
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-medium">
                            In Attesa
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-xs">
                        {new Date(quote.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/p/${quote.id}`}
                          target="_blank"
                          className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                        >
                          Apri Deal Room ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}