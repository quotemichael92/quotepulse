'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  quoteId: string
  amount: number
  title: string
  clientEmail: string
}

export default function CheckoutButton({ quoteId, amount, title, clientEmail }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayDeposit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, amount, title, clientEmail }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Errore nella creazione del pagamento')
      }
    } catch (err) {
      console.error(err)
      alert('Si è verificato un errore imprevisto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayDeposit}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Elaborazione...' : 'Accetta e Paga Acconto (50%)'}
    </button>
  )
}