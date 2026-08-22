'use client'

import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface Option {
  id: string
  title: string
  description: string
  price: number
  days: number
}

interface InteractiveQuoteViewProps {
  quoteId?: string
  initialData?: {
    title?: string
    basePrice?: number
    baseDays?: number
    options?: Option[]
    fomoHours?: number
  }
}

export default function InteractiveQuoteView({ quoteId: propQuoteId, initialData }: InteractiveQuoteViewProps) {
  // Estrazione sicura dell'ID dalla URL attuale
  const [quoteId, setQuoteId] = useState<string>(() => {
    if (propQuoteId && propQuoteId !== 'undefined' && propQuoteId !== 'null' && propQuoteId !== 'default') {
      return propQuoteId
    }
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/')
      const pIndex = segments.indexOf('p')
      if (pIndex !== -1 && segments[pIndex + 1]) {
        return segments[pIndex + 1]
      }
      if (segments[2]) {
        return segments[2]
      }
    }
    return ''
  })

  const [quoteData, setQuoteData] = useState<any>(initialData || null)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (!quoteId || quoteId === 'default' || initialData) {
      if (initialData) setLoading(false)
      return
    }

    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes/${quoteId}`)
        const data = await res.json()
        if (res.ok && data.success && data.quote) {
          setQuoteData(data.quote)
        } else {
          console.error("Preventivo non trovato nel database.")
        }
      } catch (err) {
        console.error('Errore caricamento preventivo:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuote()
  }, [quoteId, initialData])

  // Tracciamento visualizzazione
  useEffect(() => {
    if (!quoteId || quoteId === 'default') return
    fetch(`/api/quotes/${quoteId}/viewed`, { method: 'POST' }).catch(() => {})
  }, [quoteId])

  const initialFomoHours = quoteData?.fomo_hours ?? quoteData?.fomoHours ?? initialData?.fomoHours ?? 24
  const [fomoHours, setFomoHours] = useState<number>(initialFomoHours)
  const [timeLeft, setTimeLeft] = useState({ hours: initialFomoHours, minutes: 0, seconds: 0 })

  useEffect(() => {
    const hoursFromDb = quoteData?.fomo_hours ?? quoteData?.fomoHours ?? initialData?.fomoHours ?? 24
    setFomoHours(hoursFromDb)
    setTimeLeft(prev => ({ ...prev, hours: hoursFromDb }))
  }, [quoteData, initialData])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleHoursChange = (newHours: number) => {
    const validated = Math.max(1, Math.min(168, newHours))
    setFomoHours(validated)
    setTimeLeft(prev => ({ ...prev, hours: validated, minutes: 0, seconds: 0 }))
  }

  const clientName = quoteData?.client_name || 'Cliente'
  const title = `Proposta commerciale per ${clientName}`
  const descriptionText = quoteData?.project_description || quoteData?.description || 'Sviluppo piattaforma web e configurazione servizi digitali.'
  
  const basePrice = Number(quoteData?.amount ?? quoteData?.base_price ?? 1000)
  const baseDays = Number(quoteData?.base_days ?? 10)

  const options: Option[] = quoteData?.options ?? initialData?.options ?? [
    {
      id: 'opt-1',
      title: 'Integrazione Stripe Checkout',
      description: 'Gestione pagamenti automatizzata e ricevute fiscali',
      price: 250,
      days: 2,
    },
    {
      id: 'opt-2',
      title: 'Supporto Prioritario 24/7',
      description: 'Assistenza dedicata e SLA garanzia uptime post-lancio',
      price: 150,
      days: 0,
    },
    {
      id: 'opt-3',
      title: 'Ottimizzazione SEO & Performance Advanced',
      description: 'Punteggio 95+ su Google PageSpeed e setup indicizzazione Meta',
      price: 300,
      days: 3,
    },
  ]

  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [budgetLimit, setBudgetLimit] = useState(basePrice + 500)
  const [clientNotes, setClientNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (basePrice > 0) {
      setBudgetLimit(basePrice + 500)
    }
  }, [basePrice])

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const totalAmount = basePrice + options
    .filter((opt) => selectedOptions.includes(opt.id))
    .reduce((sum, opt) => sum + opt.price, 0)

  const totalDays = baseDays + options
    .filter((opt) => selectedOptions.includes(opt.id))
    .reduce((sum, opt) => sum + opt.days, 0)

  const isOverBudget = totalAmount > budgetLimit

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#f59e0b'],
    })
  }

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()

    if (!hasSignature) {
      setHasSignature(true)
      triggerConfetti()
    }
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleAcceptAndPay = async () => {
    if (!hasSignature || isSubmitting) return
    if (!quoteId) {
      alert('ID preventivo mancante.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          amount: totalAmount,
          selectedOptions,
          clientNotes,
          title,
        }),
      })

      const data = await res.json()

      if (data?.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Errore durante la creazione della sessione di pagamento.')
        setIsSubmitting(false)
      }
    } catch (err) {
      console.error('Errore:', err)
      alert('Si è verificato un errore di connessione.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1424] text-white flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Caricamento preventivo dal database...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1424] text-white flex flex-col items-center justify-center p-4 sm:p-6 my-8">
      <div className="w-full max-w-3xl bg-[#131f37]/90 border border-[#23385d] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative space-y-6">
        
        {/* FOMO TIMER & SETTING */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2 text-amber-400 font-medium text-xs sm:text-sm">
            <span>🔥</span>
            <span>Offerta a tempo: blocco slot prioritario</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-[#0d1424]/60 border border-amber-500/30 px-2 py-1 rounded-lg">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">Durata (h):</span>
              <input
                type="number"
                min="1"
                max="168"
                value={fomoHours}
                onChange={(e) => handleHoursChange(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-mono text-xs text-center focus:outline-none border-b border-amber-400/50"
              />
            </div>

            <div className="bg-white text-slate-950 px-3 py-1 rounded-lg font-mono text-xs font-black shadow-md shrink-0">
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Preventivo Interattivo</h1>
              <p className="text-slate-300 text-sm mt-1">{title}</p>
            </div>
            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-3 py-1 rounded-full font-semibold shrink-0">
              Personalizzato per {clientName}
            </span>
          </div>
        </div>

        {/* BUDGET & CONSEGNA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-[#182744]/40 border border-[#273d67] rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="font-semibold text-slate-300">Target Budget stimato</span>
              <span className={`font-bold ${isOverBudget ? 'text-amber-400' : 'text-emerald-400'}`}>
                €{budgetLimit} {isOverBudget && '(Budget Superato)'}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="50"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="bg-[#182744]/40 border border-[#273d67] rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Consegna Stimata</span>
            <span className="text-xl font-extrabold text-blue-400 mt-0.5">{totalDays} Giorni Lavorativi</span>
          </div>
        </div>

        {/* SERVIZIO BASE */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">SERVIZIO BASE</span>
          <div className="bg-[#182744]/80 border border-[#273d67] rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white text-sm">{descriptionText}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Inclusi nei termini concordati</p>
            </div>
            <span className="font-bold text-white text-base shrink-0 ml-4">€{basePrice}</span>
          </div>
        </div>

        {/* OPZIONI */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">MODULI & OPZIONI AGGIUNTIVE</span>
          <div className="space-y-2.5">
            {options.map((opt) => {
              const isSelected = selectedOptions.includes(opt.id)
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1e345e]/80 border-[#3b82f6] shadow-lg shadow-blue-500/5'
                      : 'bg-[#182744]/40 border-[#273d67] hover:border-[#335288]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#0d1424] border-slate-600 cursor-pointer"
                    />
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-white">{opt.title}</h4>
                      <p className="text-[11px] text-slate-400">{opt.description}</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 shrink-0 ml-2">+€{opt.price}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* FIRMA */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 block">Firma nel riquadro sottostante per accettare</label>
            {hasSignature && (
              <button type="button" onClick={clearCanvas} className="text-xs text-rose-400 hover:underline">
                Cancella firma
              </button>
            )}
          </div>
          <div className="bg-white border border-[#273d67] rounded-xl overflow-hidden relative shadow-inner">
            <canvas
              ref={canvasRef}
              width={650}
              height={130}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[130px] cursor-crosshair touch-none bg-white"
            />
            {!hasSignature && (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none select-none">
                Disegna qui la tua firma
              </span>
            )}
          </div>
        </div>

        {/* PAY BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#23385d] gap-4">
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Totale da Pagare</p>
            <p className="text-3xl font-extrabold text-white">€{totalAmount}</p>
          </div>

          <button
            type="button"
            onClick={handleAcceptAndPay}
            disabled={isSubmitting || !hasSignature}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 text-white text-sm font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Apertura Stripe...' : 'Firma e Paga con Stripe'}
          </button>
        </div>

      </div>
    </div>
  )
}