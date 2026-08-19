'use client'

import { useState } from 'react'

export default function DashboardClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes, setQuotes] = useState(initialQuotes || [])
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [fomoHours, setFomoHours] = useState('48')
  
  // Stato per i moduli opzionali dinamici
  const [options, setOptions] = useState([{ title: '', price: '' }])
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleAddOption = () => {
    setOptions([...options, { title: '', price: '' }])
  }

  const handleOptionChange = (index: number, field: 'title' | 'price', value: string) => {
    const updated = [...options]
    updated[index][field] = value
    setOptions(updated)
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Filtra opzioni valide
    const validOptions = options
      .filter(o => o.title.trim() !== '' && o.price !== '')
      .map(o => ({ title: o.title, price: Number(o.price) }))

    try {
      // Chiamata all'API /api/quotes/create
      const res = await fetch('/api/quotes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          description,
          basePrice: Number(basePrice),
          fomoHours: Number(fomoHours),
          options: validOptions
        })
      })

      const data = await res.json()
      if (data.success && data.quote) {
        setQuotes([data.quote, ...quotes])
        // Reset form dopo creazione
        setClientName('')
        setClientEmail('')
        setDescription('')
        setBasePrice('')
        setOptions([{ title: '', price: '' }])
      } else {
        alert("Si è verificato un errore durante la creazione del preventivo.")
      }
    } catch (err) {
      console.error(err)
      alert("Errore di connessione al server.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/p/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">DESCRIZIONE PROGETTO</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dettagli e scope del progetto..."
                className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">PREZZO BASE (€)</label>
                <input
                  type="number"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">TIMER FOMO (ORE)</label>
                <input
                  type="number"
                  value={fomoHours}
                  onChange={(e) => setFomoHours(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* MODULI OPZIONALI DINAMICI */}
            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">MODULI E SERVIZI OPZIONALI</label>
              
              {options.map((opt, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="Es. Manutenzione Annuale"
                    value={opt.title}
                    onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="€ Prezzo"
                    value={opt.price}
                    onChange={(e) => handleOptionChange(index, 'price', e.target.value)}
                    className="w-28 bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-400 hover:text-red-300 px-2 py-1 text-sm font-bold rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-1 inline-block transition-colors"
              >
                + Aggiungi un altro modulo opzionale
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all text-sm mt-4 shadow-lg shadow-blue-600/20"
            >
              {loading ? 'Generazione in corso...' : 'Genera e invia Preventivo'}
            </button>
          </form>
        </div>

        {/* ELENCO PREVENTIVI INVIATI */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-white mb-2">Preventivi Inviati</h2>
          
          <div className="space-y-3 overflow-y-auto flex-1 max-h-[650px] pr-1">
            {quotes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nessun preventivo ancora creato.</p>
            ) : (
              quotes.map((q) => (
                <div key={q.id} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center hover:border-slate-600 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{q.client_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        q.status === 'PAID' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' :
                        q.status === 'VIEWED' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' :
                        'bg-slate-700 text-blue-300 border border-slate-600'
                      }`}>
                        {q.status || 'PENDING'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{q.client_email}</p>
                    <p className="text-xs text-slate-500 mt-1">Base: €{q.base_price}</p>
                  </div>
                  
                  <button
                    onClick={() => handleCopyLink(q.id)}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                  >
                    {copiedId === q.id ? 'Copiato! ✓' : 'Copia Link'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}