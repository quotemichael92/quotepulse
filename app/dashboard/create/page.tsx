'use client'

import { useState } from 'react'

export default function CreateQuotePage() {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const handleAiSuggest = async () => {
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: projectDescription || `Preventivo per ${clientName || 'cliente'}` }),
      })
      const data = await res.json()
      if (data.success && data.suggestion) {
        setProjectDescription(data.suggestion)
      } else {
        alert(data.error || "Errore IA")
      }
    } catch (err) {
      alert("Errore connessione IA")
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
        const realId = data.quote.id || data.quote.uuid
        window.location.href = `/p/${realId}`
      } else {
        alert(data.error || "Errore creazione preventivo")
      }
    } catch (err) {
      alert("Errore di connessione")
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Crea Deal Room Dinamica</h1>
      <form onSubmit={handleCreateQuote} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">NOME CLIENTE / AZIENDA</label>
          <input 
            type="text" 
            value={clientName} 
            onChange={(e) => setClientName(e.target.value)} 
            required
            placeholder="es. Giulia Rossi (TechLabs)"
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">EMAIL DI CONTATTO</label>
          <input 
            type="email" 
            value={clientEmail} 
            onChange={(e) => setClientEmail(e.target.value)} 
            required
            placeholder="giulia@techlabs.it"
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium">OBIETTIVI DEL PROGETTO & DELIVERABLES</label>
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
            placeholder="Architettura piattaforma web ad alte performance & Automazione flussi."
            className="w-full p-2 border rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IMPORTO (€)</label>
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        >
          Crea Deal Room
        </button>
      </form>
    </div>
  )
}