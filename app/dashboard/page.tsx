'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  
  // Stati del form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectDescription, setProjectDescription] = useState('Architettura piattaforma web ad alte performance & Automazione flussi.');
  const [baseAmount, setBaseAmount] = useState(2800);
  const [timerFomo, setTimerFomo] = useState(24);
  
  // Moduli dinamici (input libero)
  const [modules, setModules] = useState<string[]>([
    'Core App & Dashboard', 
    'Integrazione Stripe Checkout', 
    'Autenticazione & Utenti'
  ]);
  const [newModuleInput, setNewModuleInput] = useState('');
  
  // Add-on & Feature di Mercato Uniche (Risk-Reversal e Scope Shield)
  const [addons, setAddons] = useState<{ [key: string]: { name: string; price: number; selected: boolean; badge: string } }>({
    priority: { name: 'SLA Intervento Garantito (< 4h)', price: 400, selected: true, badge: 'High Priority' },
    guarantee: { name: 'Garanzia Risultato Milestone (Risk-Free)', price: 600, selected: false, badge: 'Market Unique' },
    scopeShield: { name: 'Pacchetto Scope Creep (3 Modifiche Extra incluse)', price: 450, selected: false, badge: 'Zero Sorprese' },
    seo: { name: 'Ottimizzazione SEO & Performance Avanzata', price: 500, selected: false, badge: 'Growth' },
  });

  // Nota Vocale / Strategica del Professionista
  const [audioPitchNote, setAudioPitchNote] = useState('Ciao! Ho strutturato questo preventivo eliminando i rischi tecnici iniziali. Possiamo partire subito.');

  // Stati firma Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  // Calcolo totale dinamico
  const addonsTotal = Object.values(addons).reduce((acc, curr) => curr.selected ? acc + curr.price : acc, 0);
  const totalAmount = baseAmount + addonsTotal;

  // Funzione per generare contenuti con l'IA (corretta per evitare blocchi e l'errore rosso)
  const handleAiGenerate = async () => {
    setAiLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientName: clientName || 'Cliente', 
          projectDescription: projectDescription || 'Progetto generico' 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore generazione IA');
      
      if (data.projectDescription) setProjectDescription(data.projectDescription);
      if (data.audioPitchNote) setAudioPitchNote(data.audioPitchNote);
    } catch (err: any) {
      setError(err.message || 'Errore durante la generazione con IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleInput.trim()) return;
    setModules(prev => [...prev, newModuleInput.trim()]);
    setNewModuleInput('');
  };

  const handleRemoveModule = (indexToRemove: number) => {
    setModules(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleToggleAddon = (key: string) => {
    setAddons(prev => ({
      ...prev,
      [key]: { ...prev[key], selected: !prev[key].selected }
    }));
  };

  // Funzioni per la Firma Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const signatureDataUrl = canvasRef.current && hasSigned ? canvasRef.current.toDataURL() : null;

      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          projectDescription,
          amount: totalAmount,
          timerFomo,
          options: [
            ...modules, 
            ...Object.values(addons).filter(a => a.selected).map(a => `${a.name} (+€${a.price})`),
            `Nota Vocale/Strategica: "${audioPitchNote}"`
          ],
          signature: signatureDataUrl
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la creazione del preventivo');
      }

      if (data.success && data.quote && data.quote.id) {
        router.push(`/p/${data.quote.id}`);
      } else {
        throw new Error('Risposta non valida dal server');
      }
    } catch (err: any) {
      setError(err.message || 'Errore imprevisto');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070b] text-white p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header di Mercato Unico */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-[#111827] to-blue-950/40 border border-purple-900/30 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-purple-200">QuotePulse Disruption Engine</h2>
              <p className="text-xs text-gray-400">Trattative interattive anti-ghosting con Risk-Reversal integrato</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-500/30 px-4 py-2 rounded-xl">
            <span className="text-xs text-gray-300">Scadenza Blocco Prezzo:</span>
            <span className="text-purple-400 font-mono font-bold text-sm">{timerFomo}:00:00</span>
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-purple-200 to-blue-400 bg-clip-text text-transparent">
            Crea Deal Room Dinamica
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Configura la proposta commerciale definitiva che i tuoi clienti ameranno esplorare e firmare all'istante.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Box Cliente & Pitch Vocale */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                <span>🎯</span> Anagrafica & Video/Audio Pitch Strategico
              </h3>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <span>✨</span> {aiLoading ? 'Generazione IA...' : 'Ottimizza con IA'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Nome Cliente / Azienda</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="es. Giulia Rossi (TechLabs)"
                  className="w-full bg-[#182234] border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email di Contatto</label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="giulia@techlabs.it"
                  className="w-full bg-[#182234] border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Obiettivi del Progetto & Deliverables</label>
              <textarea
                rows={2}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full bg-[#182234] border border-gray-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span>🎙️</span> Nota Audio / Messaggio Strategico per il Cliente (Rompi-ghiaccio)
              </label>
              <input
                type="text"
                value={audioPitchNote}
                onChange={(e) => setAudioPitchNote(e.target.value)}
                className="w-full bg-[#131b2e] border border-purple-900/50 rounded-lg px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-gray-400">Il cliente vedrà questo messaggio in evidenza all'apertura della Deal Room per azzerare le resistenze.</p>
            </div>
          </div>

          {/* Box Budget & Slider con Preset */}
          <div className="bg-[#111827]/80 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                  <span>💶</span> Investimento Base Progetto
                </h3>
                <p className="text-xs text-gray-400">Seleziona un preset rapido o regola finemente il budget</p>
              </div>
              <div className="flex gap-2">
                {[1800, 3200, 5000, 7500].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBaseAmount(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${baseAmount === preset ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-[#1f2937] text-gray-400 hover:bg-gray-700'}`}
                  >
                    €{preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#182234]/60 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-300">Valore Selezionato:</span>
                <span className="text-3xl font-extrabold text-purple-400 font-mono">€{baseAmount}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-gray-700 rounded-lg"
              />
            </div>
          </div>

          {/* Moduli Dinamici & Add-on */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Moduli Dinamici Inseriti dal Professionista */}
            <div className="bg-[#111827]/80 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4 flex items-center gap-2">
                  <span>🧩</span> Moduli Core Inclusi (Aggiungi Personalizzati)
                </h3>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newModuleInput}
                    onChange={(e) => setNewModuleInput(e.target.value)}
                    placeholder="es. API Custom / Pannello Admin"
                    className="flex-1 bg-[#182234] border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    + Aggiungi
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {modules.map((mod, index) => (
                    <div
                      key={index}
                      className="bg-[#182234]/60 border border-gray-800 p-3 rounded-xl text-sm text-gray-200 flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{mod}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(index)}
                        className="text-gray-500 hover:text-red-400 text-xs font-bold px-2 py-1 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-4">Nessun modulo inserito. Aggiungine almeno uno.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Add-on Unici di Mercato */}
            <div className="bg-[#111827]/80 backdrop-blur-md border border-gray-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4 flex items-center gap-2">
                  <span>🛡️</span> Add-on Antighosting & Garanzie
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(addons).map(([key, addon]) => (
                    <div
                      key={key}
                      onClick={() => handleToggleAddon(key)}
                      className={`cursor-pointer p-3 rounded-xl border text-sm transition flex items-center justify-between ${
                        addon.selected 
                          ? 'bg-emerald-600/10 border-emerald-500/80 text-emerald-200' 
                          : 'bg-[#182234]/40 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addon.name}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">{addon.badge}</span>
                        </div>
                        <div className={`text-xs font-mono font-bold mt-1 ${addon.selected ? 'text-emerald-400' : 'text-gray-500'}`}>+€{addon.price}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs ${addon.selected ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-gray-700'}`}>
                        {addon.selected ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Totale & Firma Canvas */}
          <div className="bg-gradient-to-br from-[#111827] to-[#0a0f1d] border border-purple-900/60 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
            
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-800 pb-6 gap-4">
              <div>
                <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Totale Deal Room Configurato</span>
                <p className="text-xs text-gray-500">Trasparenza totale senza costi nascosti</p>
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-purple-400 font-mono tracking-tight">
                €{totalAmount}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Firma Digitale per Sblocco Immediato</label>
                <button 
                  type="button" 
                  onClick={clearCanvas} 
                  className="text-xs text-purple-400 hover:underline font-medium"
                >
                  Pulisci firma
                </button>
              </div>
              <div className="border border-gray-700/80 rounded-xl overflow-hidden bg-[#182234]/60 flex justify-center shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={650}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full cursor-crosshair touch-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 italic">La firma autentica istantaneamente il contratto e attiva il canale di comunicazione dedicato nella Deal Room.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-purple-600/30 transition duration-200 flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {loading ? 'Generazione Deal Room...' : '🚀 Lancia Deal Room Rivoluzionaria & Genera Link'}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}