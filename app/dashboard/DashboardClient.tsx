'use client'

import { useState } from 'react'

export default function DashboardClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [quotes, setQuotes] = useState(initialQuotes)
  const [isAiLoading, setIsAiLoading] = useState(false)

  // AGGIUNTA CHIRURGICA: Funzione OpenAI pulita e isolata
  const handleAiSuggest = async () => {
    if (!projectDescription && !clientName) {
      alert("Scrivi prima due parole nella descrizione o il nome del cliente.")
      return
    }

    setIsAiLoading(true)
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: projectDescription || `Preventivo per ${clientName}` }),
      })
      const data = await res.json()
      
      if (data.success && data.suggestion) {
        setProjectDescription(data.suggestion)
      } else {
        alert(data.error || "Errore durante la generazione con IA.")
      }
    } catch (err) {
      console.error('Errore IA:', err)
      alert("Errore di connessione con l'IA.")
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
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
          {/* AGGIUNTA CHIRURGICA: Intestazione con il pulsante ✨ Genera con IA */}
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">Descrizione Progetto</label>
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded shadow transition-all disabled:opacity-50"
            >
              {isAiLoading ? '✨ Sto pensando...' : '✨ Genera con IA'}
            </button>
          </div>
          <textarea 
            value={projectDescription} 
            onChange={(e) => setProjectDescription(e.target.value)} 
            rows={4}
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Importo (€)</label>
          <input 
            type="number" 
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