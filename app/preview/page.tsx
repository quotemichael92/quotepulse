'use client';

import { useEffect, useState } from 'react';

export default function PreviewPage() {
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('quote_preview');
    if (savedData) {
      setQuote(JSON.parse(savedData));
    }
  }, []);

  if (!quote) {
    return (
      <main className="min-h-screen bg-[#05070b] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-gray-400 text-sm">Nessun dato di anteprima trovato.</p>
          <p className="text-xs text-gray-500">Torna alla dashboard e clicca nuovamente su "Anteprima Cliente".</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Banner Anteprima */}
        <div className="bg-purple-900/20 border border-purple-500/40 text-purple-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>🔍 Modalità Anteprima Cliente (Live Preview)</span>
          <span className="font-mono">QuotePulse Deal Room</span>
        </div>

        {/* Intestazione Preventivo */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Proposta Dedicata per</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">{quote.clientName}</h1>
              <p className="text-xs text-gray-400 mt-1">{quote.clientEmail}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Totale Investimento</span>
              <span className="text-3xl md:text-4xl font-extrabold text-purple-400 font-mono">€{quote.amount}</span>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Obiettivi & Deliverables</h3>
            <p className="text-sm text-gray-200 bg-[#182234]/60 p-4 rounded-xl border border-gray-800">{quote.projectDescription}</p>
          </div>

          {/* Nota Vocale / Strategica */}
          <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <span>🎙️</span> Nota Strategica del Professionista
            </span>
            <p className="text-xs text-purple-200 italic">{quote.options.find((o: string) => o.startsWith('Nota Vocale')) || 'Nessuna nota inserita.'}</p>
          </div>

          {/* Moduli & Opzioni Selezionate */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Dettaglio Componenti & Moduli</h3>
            <div className="space-y-2">
              {quote.options.filter((o: string) => !o.startsWith('Nota Vocale') && !o.startsWith('Termini di Pagamento')).map((opt: string, i: number) => (
                <div key={i} className="bg-[#182234]/40 border border-gray-800/80 px-4 py-3 rounded-xl text-xs flex justify-between items-center text-gray-200">
                  <span>{opt}</span>
                  <span className="text-emerald-400 font-bold">Incluso</span>
                </div>
              ))}
            </div>
          </div>

          {/* Condizioni di Pagamento */}
          <div className="bg-[#182234]/40 border border-gray-800 p-4 rounded-xl flex justify-between items-center text-xs">
            <span className="text-gray-400">Modalità di Pagamento:</span>
            <span className="font-bold text-purple-300">{quote.paymentTerms}</span>
          </div>

        </div>

      </div>
    </main>
  );
}