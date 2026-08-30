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
  initialData?: any
}

export default function InteractiveQuoteView({ quoteId: propQuoteId, initialData }: InteractiveQuoteViewProps) {
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

  const initialFomoHours = Number(
    quoteData?.fomo_hours ?? 
    quoteData?.fomoHours ?? 
    initialData?.fomo_hours ?? 
    initialData?.fomoHours ?? 
    24
  )

  const [fomoHours, setFomoHours] = useState<number>(initialFomoHours)
  const [timeLeft, setTimeLeft] = useState({ hours: initialFomoHours, minutes: 0, seconds: 0 })

  useEffect(() => {
    const hoursFromDb = Number(
      quoteData?.fomo_hours ?? 
      quoteData?.fomoHours ?? 
      initialData?.fomo_hours ?? 
      initialData?.fomoHours ?? 
      24
    )
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

  const clientName = quoteData?.client_name || quoteData?.clientName || 'Cliente'
  const clientEmail = quoteData?.client_email || quoteData?.clientEmail || ''
  const title = `Proposta commerciale per ${clientName}`
  const descriptionText = quoteData?.project_description || quoteData?.projectDescription || quoteData?.description || 'Sviluppo piattaforma web e configurazione servizi digitali.'
  
  const basePrice = Number(quoteData?.amount ?? quoteData?.base_price ?? quoteData?.basePrice ?? 1000)
  const initialBaseDays = Number(quoteData?.base_days ?? quoteData?.baseDays ?? 10)
  const [baseDays, setBaseDays] = useState<number>(initialBaseDays)

  // Sincronizza i giorni base se cambiano i dati iniziali/DB
  useEffect(() => {
    const dbDays = Number(quoteData?.base_days ?? quoteData?.baseDays ?? initialData?.base_days ?? initialData?.baseDays ?? 10)
    setBaseDays(dbDays)
  }, [quoteData, initialData])

  const paymentTerms = quoteData?.payment_terms || quoteData?.paymentTerms || 'Concordato offline / Fattura differita'

  // Estrazione e normalizzazione delle opzioni dal DB (prezzo 0 per acconto e nota vocale)
  const rawOptions = quoteData?.options || initialData?.options || []
  const options: Option[] = Array.isArray(rawOptions) 
    ? rawOptions.map((opt: any, index: number) => {
        if (typeof opt === 'string') {
          const lowerOpt = opt.toLowerCase()
          const isZeroPrice = lowerOpt.includes('acconto') || lowerOpt.includes('nota') || lowerOpt.includes('vocale')
          return {
            id: `opt-${index}`,
            title: opt,
            description: 'Modulo opzionale incluso nella proposta',
            price: isZeroPrice ? 0 : 150,
            days: 1
          }
        }
        const titleStr = (opt.title || opt.name || 'Opzione').toLowerCase()
        const isZeroPrice = titleStr.includes('acconto') || titleStr.includes('nota') || titleStr.includes('vocale')
        return {
          id: opt.id || `opt-${index}`,
          title: opt.title || opt.name || 'Opzione',
          description: opt.description || '',
          price: isZeroPrice ? 0 : Number(opt.price ?? opt.cost ?? 150),
          days: Number(opt.days ?? opt.deliveryDays ?? 1)
        }
      })
    : []

  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [budgetLimit, setBudgetLimit] = useState(basePrice + 500)
  const [clientNotes, setClientNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)

  // Stati per la gestione della nota audio opzionale
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Inizializza tutte le opzioni come selezionate di default
  useEffect(() => {
    if (basePrice > 0) {
      setBudgetLimit(basePrice + 500)
    }
    if (options.length > 0 && selectedOptions.length === 0) {
      setSelectedOptions(options.map(o => o.id))
    }
  }, [basePrice, options.length])

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Calcolo totale prezzo e giorni sommando le opzioni attive
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
      particleCount: 90,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'],
    })
  }

  // Gestione Registrazione Audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Errore accesso microfono:', err)
      alert('Impossibile accedere al microfono. Controlla i permessi del browser.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const deleteAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
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

  const handleAcceptQuote = async () => {
    if (!hasSignature || isSubmitting) return
    if (!quoteId) {
      alert('ID preventivo mancante.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('quoteId', quoteId)
      formData.append('amount', totalAmount.toString())
      formData.append('selectedOptions', JSON.stringify(selectedOptions))
      formData.append('clientNotes', clientNotes)
      
      if (audioBlob) {
        formData.append('audioNote', audioBlob, 'nota-audio-cliente.webm')
      }

      const canvas = canvasRef.current
      if (canvas) {
        const signatureDataUrl = canvas.toDataURL('image/png')
        formData.append('signature', signatureDataUrl)
      }

      const res = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setIsAccepted(true)
        triggerConfetti()
      } else {
        alert(data.error || 'Errore durante la conferma del preventivo.')
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

  if (isAccepted) {
    setTimeout(() => {
      window.open(`/api/quotes/${quoteId}/pdf`, '_blank')
      window.location.href = '/'
    }, 3000)

    return (
      <div className="min-h-screen bg-[#0d1424] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131f37] border border-[#23385d] rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce">
            ✓
          </div>
          <h2 className="text-xl font-bold text-white">Preventivo Accettato!</h2>
          <p className="text-slate-300 text-sm">
            Grazie {clientName}. Firma e preferenze registrate con successo.
          </p>
          <p className="text-xs text-blue-400 animate-pulse pt-2">
            Generazione PDF e reindirizzamento in corso...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1424] text-white flex flex-col items-center justify-center p-4 sm:p-6 my-8">
      <div className="w-full max-w-3xl bg-[#131f37]/90 border border-[#23385d] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative space-y-6">
        
        {/* FOMO TIMER */}
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
              {clientEmail && <p className="text-xs text-slate-400">{clientEmail}</p>}
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
            <div className="flex items-center space-x-1.5 mt-1">
              <input
                type="number"
                min="1"
                max="365"
                value={baseDays}
                onChange={(e) => setBaseDays(Math.max(1, Number(e.target.value)))}
                className="w-14 bg-[#0d1424] border border-blue-500/50 rounded-lg text-blue-400 font-extrabold text-lg text-center focus:outline-none focus:border-blue-400 py-0.5"
              />
              <span className="text-xs font-semibold text-slate-300">Giorni</span>
            </div>
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
        {options.length > 0 && (
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
                        onChange={() => {}} 
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#0d1424] border-slate-600 cursor-pointer"
                      />
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm text-white">{opt.title}</h4>
                        <p className="text-[11px] text-slate-400">{opt.description} ({opt.days} {opt.days === 1 ? 'giorno' : 'giorni'})</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 shrink-0 ml-2">
                      {opt.price === 0 ? 'Incluso' : `+€${opt.price}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* NOTA AUDIO OPZIONALE E NOTE TESTUALI */}
        <div className="space-y-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">NOTE O MESSAGGIO AUDIO PER IL PROGETTO</span>
          
          <div className="bg-[#182744]/40 border border-[#273d67] rounded-xl p-4 space-y-3">
            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Aggiungi eventuali note o richieste particolari..."
              className="w-full bg-[#0d1424] border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {!isRecording && !audioUrl && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs px-3 py-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <span>🎙️</span>
                    <span>Registra nota vocale</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="bg-rose-600 text-white animate-pulse text-xs px-3 py-2 rounded-lg font-medium flex items-center space-x-1.5"
                  >
                    <span>⏹️</span>
                    <span>Ferma registrazione</span>
                  </button>
                )}

                {audioUrl && (
                  <div className="flex items-center space-x-2">
                    <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                    <button
                      type="button"
                      onClick={deleteAudio}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Elimina audio
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-400">Opzionale</span>
            </div>
          </div>
        </div>

        {/* CONDIZIONI DI PAGAMENTO */}
        <div className="bg-[#182744]/40 border border-[#273d67] p-4 rounded-xl flex justify-between items-center text-xs">
          <span className="text-slate-400">Condizioni commerciali:</span>
          <span className="font-bold text-blue-300">{paymentTerms}</span>
        </div>

        {/* FIRMA */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 block">Firma nel riquadro sottostante per accettare il preventivo</label>
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

        {/* CONFERMA E ACCETTAZIONE */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#23385d] gap-4">
          <div>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Totale Preventivo</p>
            <p className="text-3xl font-extrabold text-white">€{totalAmount}</p>
          </div>

          <button
            type="button"
            onClick={handleAcceptQuote}
            disabled={isSubmitting || !hasSignature}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 text-white text-sm font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Invio in corso...' : 'Conferma e Accetta Preventivo'}
          </button>
        </div>

      </div>
    </div>
  )
}