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

export default function InteractiveQuoteView({ quoteId }: { quoteId: string }) {
  

  // 1. TRACCIAMENTO AUTOMATICO APERTURA
  useEffect(() => {
    if (!quoteId) return
    const markAsViewed = async () => {
      try {
        await fetch(`/api/quotes/${quoteId}/viewed`, { method: 'POST' })
      } catch (err) {
        console.error('Errore nel tracciare la visualizzazione:', err)
      }
    }
    markAsViewed()
  }, [quoteId])

  // 2. TIMER FOMO
  const [timeLeft, setTimeLeft] = useState({ hours: 47, minutes: 59, seconds: 59 })

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

  // 3. BUDGET SLIDER INTERATTIVO
  const [budgetLimit, setBudgetLimit] = useState(2200)

  // BASE & OPZIONI (con tempi di consegna espressi in giorni)
  const basePrice = 1550
  const baseDays = 12

  const options: Option[] = [
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

  const [selectedOptions, setSelectedOptions] = useState<string[]>(['opt-1'])
  const [clientNotes, setClientNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // CALCOLI DINAMICI
  const calculateTotal = () => {
    const optionsTotal = options
      .filter((opt) => selectedOptions.includes(opt.id))
      .reduce((sum, opt) => sum + opt.price, 0)
    return basePrice + optionsTotal
  }

  const calculateDays = () => {
    const optionsDays = options
      .filter((opt) => selectedOptions.includes(opt.id))
      .reduce((sum, opt) => sum + opt.days, 0)
    return baseDays + optionsDays
  }

  const totalAmount = calculateTotal()
  const totalDays = calculateDays()
  const isOverBudget = totalAmount > budgetLimit

  // 4. CANVAS DISEGNO FIRMA
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()

    if (!hasSignature) {
      setHasSignature(true)
      triggerConfetti()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  // PAGAMENTO E INVIO
  const handleAcceptAndPay = async () => {
    if (!hasSignature || isSubmitting) return
    setIsSubmitting(true)

    const canvas = canvasRef.current
    const signatureData = canvas ? canvas.toDataURL() : ''

    try {
      await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          signatureData,
          selectedOptions,
          clientNotes,
        }),
      }).catch(() => null)

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: String(quoteId),
          amount: totalAmount,
          title: 'Sviluppo piattaforma web e integrazione dashboard',
        }),
      })

      const data = await res.json()

      if (data?.url) {
        window.location.href = data.url
      } else {
        alert(data?.error || 'Impossibile avviare il pagamento con Stripe.')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      alert(err?.message || 'Si è verificato un errore.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1424] text-white flex flex-col items-center justify-center p-4 sm:p-6 my-8">
      <div className="w-full max-w-3xl bg-[#131f37]/90 border border-[#23385d] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative space-y-6">
        
        {/* BANNER FOMO TIMER */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center space-x-2 text-amber-400 font-medium text-xs sm:text-sm">
            <span>🔥</span>
            <span>Offerta a tempo: blocco slot prioritario e condizioni garantite</span>
          </div>
          <div 
            style={{ backgroundColor: '#ffffff', color: '#000000' }} 
            className="px-3 py-1 rounded-lg font-mono text-xs font-black shadow-md shrink-0"
          >
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>

        {/* INTESTAZIONE E MESSAGGIO INTRODUTTIVO */}
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                Preventivo Interattivo
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Sviluppo piattaforma web professionale & Integrazione Dashboard.
              </p>
            </div>
            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-3 py-1 rounded-full font-semibold shrink-0">
              Personalizzato per te
            </span>
          </div>

          {/* BOX VIDEO/AUDIO INTRO (WIDGET LOOM MOCKUP) */}
          <div className="bg-[#182744]/60 border border-[#273d67] rounded-xl p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
                ▶
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Presentazione della Proposta (1 min)</p>
                <p className="text-[11px] text-slate-400">Ascolta una breve spiegazione sulle scelte architetturali</p>
              </div>
            </div>
            <button 
              onClick={() => alert("Puoi sostituire questo pulsante con un embed video Loom o audio reale.")}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1.5 rounded-lg transition"
            >
              Riproduci
            </button>
          </div>
        </div>

        {/* BUDGET SLIDER & TEMPO DI CONSEGNA STIMATO */}
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
              min="1500"
              max="3500"
              step="50"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="bg-[#182744]/40 border border-[#273d67] rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Consegna Stimata
            </span>
            <span className="text-xl font-extrabold text-blue-400 mt-0.5">
              {totalDays} Giorni Lavorativi
            </span>
          </div>
        </div>

        {/* ANTEPRIMA LIVE DEL PROGETTO (MOCKUP VISIVO DINAMICO) */}
        <div className="bg-[#0b101d] border border-[#273d67] rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider">
              Anteprima Funzionalità Incorpotate
            </span>
            <span className="text-slate-400">{selectedOptions.length + 1} Moduli Attivi</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2.5 py-1 rounded-md">
              ✓ Core App & Dashboard
            </span>
            {options.map((opt) => {
              const active = selectedOptions.includes(opt.id)
              return (
                <span
                  key={opt.id}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    active
                      ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300 font-medium'
                      : 'bg-slate-800/40 border border-slate-700/50 text-slate-500 line-through'
                  }`}
                >
                  {active ? '✓ ' : '+ '}{opt.title}
                </span>
              )
            })}
          </div>
        </div>

        {/* SERVIZIO BASE */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
            SERVIZIO BASE
          </span>
          <div className="bg-[#182744]/80 border border-[#273d67] rounded-xl p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white text-sm">Piattaforma Web & Configurazione Core</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Include architettura base, database, autenticazione utenti e layout reattivo ({baseDays} giorni)</p>
            </div>
            <span className="font-bold text-white text-base shrink-0 ml-4">
              €{basePrice}
            </span>
          </div>
        </div>

        {/* OPZIONI AGGIUNTIVE */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
            MODULI & OPZIONI AGGIUNTIVE
          </span>
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
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#0d1424] border-slate-600 cursor-pointer"
                    />
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                        {opt.title}
                        {opt.days > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (+{opt.days} {opt.days === 1 ? 'giorno' : 'giorni'})
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 shrink-0 ml-2">
                    +€{opt.price}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* TESTIMONIANZA / PROVA SOCIALE */}
        <div className="bg-[#182744]/20 border border-[#273d67]/60 rounded-xl p-3.5 italic text-xs text-slate-300 flex items-start space-x-3">
          <span className="text-amber-400 text-lg leading-none">“</span>
          <div>
            <p>I tempi stabiliti sono stati rispettati al millesimo e la qualità dell'integrazione ha superato le mie aspettative.</p>
            <span className="text-[11px] text-slate-400 not-italic block mt-1 font-semibold">— Marco R., Founder Tech</span>
          </div>
        </div>

        {/* NOTE O RICHIESTE SPECIALI DEL CLIENTE */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">
            Hai domande o richieste particolari prima di procedere? (Opzionale)
          </label>
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Aggiungi qui eventuali note sul progetto..."
            rows={2}
            className="w-full bg-[#0b101d] border border-[#273d67] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* RIQUADRO FIRMA DIGITALE (SFONDO BIANCO) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 block">
              Firma nel riquadro sottostante per accettare il preventivo
            </label>
            {hasSignature && (
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-400 hover:underline"
              >
                Cancella firma
              </button>
            )}
          </div>
          <div 
            style={{ backgroundColor: '#ffffff' }} 
            className="border border-[#273d67] rounded-xl overflow-hidden relative shadow-inner"
          >
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
              style={{ backgroundColor: '#ffffff' }}
              className="w-full h-[130px] cursor-crosshair touch-none"
            />
            {!hasSignature && (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none select-none">
                Disegna qui la tua firma
              </span>
            )}
          </div>
        </div>

        {/* FOOTER TOTALE E PULSANTE STRIPE */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#23385d] gap-4">
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Totale da Pagare (Acconto)
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-extrabold text-white">
                €{totalAmount}
              </p>
              <span className="text-xs text-slate-400">
                (inclusa garanzia soddisfatti o rimborsati)
              </span>
            </div>
          </div>

          <button
            onClick={handleAcceptAndPay}
            disabled={isSubmitting || !hasSignature}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 text-white text-sm font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Apertura Stripe...' : 'Firma e Paga con Stripe'}
          </button>
        </div>

      </div>
    </div>
  )
}