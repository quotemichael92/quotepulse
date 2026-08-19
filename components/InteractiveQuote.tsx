'use client'

import { useState } from 'react'
import CheckoutButton from '@/components/CheckoutButton'

interface Feature {
  id: string
  title: string
  price: number
  required?: boolean
}

interface InteractiveQuoteProps {
  quoteId: string
  baseAmount: number
  clientEmail: string
  description: string
  initialFeatures: Feature[]
  isPaid: boolean
}

export default function InteractiveQuote({
  quoteId,
  baseAmount,
  clientEmail,
  description,
  initialFeatures,
  isPaid,
}: InteractiveQuoteProps) {
  // Tutti i moduli opzionali partono DESELEZIONATI di default
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleFeature = (id: string) => {
    if (isPaid) return
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Calcolo totale dinamico basato sui moduli selezionati
  const addonTotal = initialFeatures
    .filter((f) => selectedIds.includes(f.id))
    .reduce((sum, f) => sum + Number(f.price || 0), 0)

  const currentTotal = baseAmount + addonTotal
  const currentDeposit = currentTotal / 2

  return (
    <div className="space-y-6">
      {/* Selector Moduli Interattivi */}
      {initialFeatures.length > 0 && (
        <div className="space-y-3">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block print:text-slate-600">
            Personalizza i Moduli del Progetto
          </label>
          <div className="space-y-2">
            {initialFeatures.map((feature) => {
              const isSelected = selectedIds.includes(feature.id)
              return (
                <div
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500/50 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isPaid}
                      onChange={() => {}}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium block text-slate-200">
                      {feature.title}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    +€{feature.price}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sommatore Dinamico */}
      <div className="flex justify-between items-center py-4 border-t border-slate-800 print:border-slate-300">
        <div>
          <div className="text-xs text-slate-400 print:text-slate-600">
            Totale Calcolato
          </div>
          <div className="text-2xl font-bold text-white">€{currentTotal}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 print:text-slate-600">
            Acconto (50%)
          </div>
          <div className="text-3xl font-extrabold text-blue-400">
            €{currentDeposit}
          </div>
        </div>
      </div>

      {/* Checkout Stripe Dinamico */}
      <div className="print:hidden">
        {!isPaid ? (
          <CheckoutButton
            quoteId={quoteId}
            amount={currentTotal}
            title={description}
            clientEmail={clientEmail}
          />
        ) : (
          <div className="w-full py-4 bg-green-500/10 text-green-400 text-center font-semibold rounded-lg border border-green-500/20">
            ✓ Acconto versato con successo
          </div>
        )}
      </div>
    </div>
  )
}