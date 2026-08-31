'use client'

import { useState } from 'react'

export default function DashboardClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [quotes, setQuotes] = useState(initialQuotes)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleAiSuggest = async () => {
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: projectDescription || `Preventivo per ${clientName}` }),
      })
      const data = await res.json()
      if (data.success) {
        setProjectDescription(data.suggestion)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()

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
        
        if (!realId) {
          alert("Errore: ID preventivo non trovato.")
          return
        }

        window.location.href = `/p/${realId}`
      } else {
        alert(data.error || "Si è verificato un errore durante la creazione del preventivo.")
      }
    } catch (err) {
      console.error('Errore:', err)
      alert("Errore di connessione al server.")
    }
  }

  const handleUpgradePro = async () => {
    setIsSubscribing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'IL_TUO_PRICE_ID_DI_STRIPE' // Sostituisci con il Price ID di Stripe
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Errore durante la creazione della sessione di abbonamento.")
      }
    } catch (err) {
      console.error(err)
      alert("Errore di connessione.")
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[#131f37] border border-[#23385d] p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white">Piano Free</h2>
          <p className="text-xs text-slate-400">Passa a Pro per sbloccare funzioni illimitate.</p>
        </div>
        <button
          onClick={handleUpgradePro}
          disabled={isSubscribing}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubscribing ? 'Reindirizzamento...' : 'Passa a Pro 🚀'}
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Crea Nuovo Preventivo</h1>
      <form onSubmit={handleCreateQuote} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome Cliente</label>
          <input 
            type="text" 
            value={clientName} 
            onChange={(e) => setClientName(e.target.value)} 
            required
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email Cliente</label>
          <input 
            type="email" 
            value={clientEmail} 
            onChange={(e) => setClientEmail(e.target.value)} 
            required
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Descrizione Progetto</label>
            <button 
              type="button" 
              onClick={handleAiSuggest} 
              className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
            >
              {isAiLoading ? '...' : '✨ Genera IA'}
            </button>
          </div>
          <textarea 
            value={projectDescription} 
            onChange={(e) => setProjectDescription(e.target.value)} 
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Importo (€)</label>
          <input 
            type="number" 
            min="100"
            step="1"
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Genera Preventivo Reale
        </button>
      </form>
    </div>
  )
}