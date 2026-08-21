'use client'

import { useState } from 'react'

export default function DashboardClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [quotes, setQuotes] = useState(initialQuotes)

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
        
        if (!realId || realId.toString().includes('demo')) {
          console.error("ID non valido ricevuto:", newQuote)
          alert("Errore: ID preventivo non valido dal database.")
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
          <label className="block text-sm font-medium mb-1">Descrizione Progetto</label>
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