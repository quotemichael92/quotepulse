'use client'

import { useState } from 'react'

interface Option {
  title: string
  price: string
}

interface Quote {
  id?: string
  _id?: string
  quote_id?: string
  slug?: string
  uuid?: string
  client_name: string
  client_email: string
  amount?: number
  base_price?: number
  status?: string
}

interface DashboardClientProps {
  initialQuotes: Quote[]
}

export default function DashboardClient({ initialQuotes }: DashboardClientProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          projectDescription,
          amount: Number(amount)
        })
      })

      const data = await res.json()
      
      if (res.ok && data.success && data.quote) {
        const newQuote = data.quote
        const realId = newQuote.id || newQuote.uuid || newQuote._id

        // Aggiorna la lista locale
        setQuotes([newQuote, ...quotes])
        
        // Pulisci il form
        setClientName('')
        setClientEmail('')
        setProjectDescription('')
        setAmount('')

        // Reindirizza direttamente alla pagina reale del preventivo (senza demo!)
        if (realId) {
          window.location.href = `/p/${realId}`
        } else {
          alert("Preventivo creato, ma ID non trovato.")
        }
      } else {
        alert(data.error || "Si è verificato un errore durante la creazione del preventivo.")
      }
    } catch (err) {
      console.error(err)
      alert("Errore di connessione al server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-950 text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold text-white">QuotePulse</h1>
        <p className="text-slate-400 text-sm">Pannello di Controllo Preventivi & Incassi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FORM CREAZIONE PREVENTIVO */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Nuovo Preventivo</h2>
          
          <form onSubmit={handleCreateQuote} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">NOME CLIENTE</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Es. Mario Rossi"
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">EMAIL CLIENTE</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="mario@example.com"
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">DESCRIZIONE PROGETTO</label>
              <textarea
                rows={3}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Dettagli e scopo del progetto..."
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">IMPORTO TOTALE (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold p-3 rounded-xl transition-colors text-sm shadow-lg disabled:opacity-50"
            >
              {loading ? 'Creazione in corso...' : 'Genera Preventivo & Apri'}
            </button>
          </form>
        </div>

        {/* LISTA PREVENTIVI INVIATI */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Preventivi Creati</h2>
          
          {quotes.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Nessun preventivo ancora creato.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {quotes.map((q, idx) => {
                const quoteId = q.id || q._id || q.quote_id || q.slug || q.uuid;
                const displayAmount = q.amount ?? q.base_price ?? 0;
                
                return (
                  <div key={idx} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{q.client_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        q.status === 'PAID' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' :
                        q.status === 'VIEWED' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' :
                        'bg-slate-700 text-blue-300 border border-slate-600'
                      }`}>
                        {q.status || 'PENDING'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mt-0.5">{q.client_email}</p>
                      <p className="text-xs text-slate-500 mt-1">Importo: €{displayAmount}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                      <span className="text-[10px] text-slate-500 font-mono">ID: {quoteId || 'Mancante'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!quoteId) {
                            alert("Questo preventivo non ha un ID valido nel database.");
                            return;
                          }
                          const url = `${window.location.origin}/p/${quoteId}`;
                          navigator.clipboard.writeText(url);
                          setCopiedId(String(quoteId));
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                      >
                        {copiedId === String(quoteId) ? 'Copiato! ✓' : 'Copia Link'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}