'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function DashboardClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [quotes, setQuotes] = useState(initialQuotes)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

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

  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoadingPlan(planName)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId,
          userId: user?.id 
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
      setLoadingPlan(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* SEZIONE ABBONAMENTI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Piano Base 29€ */}
        <div className="p-6 bg-[#131f37] border border-[#23385d] rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Piano Base</h2>
            <p className="text-2xl font-extrabold text-blue-400 mt-2">€29 <span className="text-sm font-normal text-slate-400">/mese</span></p>
            <p className="text-xs text-slate-300 mt-2">Funzioni essenziali e standard per gestire i tuoi preventivi.</p>
          </div>
          <button
            onClick={() => handleSubscribe('price_1TyBxsGc2QPdKxT7HMWzVJHs', 'base')}
            disabled={loadingPlan !== null}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
          >
            {loadingPlan === 'base' ? 'Reindirizzamento...' : 'Attiva Piano Base'}
          </button>
        </div>

        {/* Piano Pro 59€ */}
        <div className="p-6 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/40 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Piano Pro 🚀</h2>
            <p className="text-2xl font-extrabold text-purple-400 mt-2">€59 <span className="text-sm font-normal text-slate-300">/mese</span></p>
            <p className="text-xs text-slate-200 mt-2">Funzioni avanzate, Deal Room complete e intelligenza artificiale sbloccata.</p>
          </div>
          <button
            onClick={() => handleSubscribe('price_1TyC2LGc2QPdKxT7CPKm6oPB', 'pro')}
            disabled={loadingPlan !== null}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
          >
            {loadingPlan === 'pro' ? 'Reindirizzamento...' : 'Attiva Piano Pro'}
          </button>
        </div>
      </div>

      {/* FORM CREAZIONE PREVENTIVO */}
      <div className="p-6 border rounded-xl bg-card">
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
    </div>
  )
}