'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateQuotePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    projectDescription: '',
    amount: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione del preventivo')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Crea Nuovo Preventivo AI</h1>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">
            ← Torna alla Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">NOME CLIENTE</label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Es. Mario Rossi"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">EMAIL CLIENTE</label>
            <input
              type="email"
              required
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="mario@esempio.it"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">IMPORTO (€)</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="1200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">DESCRIZIONE PROGETTO</label>
            <textarea
              required
              rows={4}
              value={formData.projectDescription}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Descrivi brevemente il progetto da realizzare..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
          >
            {loading ? 'Generazione in corso...' : 'Genera Preventivo'}
          </button>
        </form>
      </div>
    </div>
  )
}