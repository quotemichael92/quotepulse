'use client'

import Link from 'next/link'

export default function QuoteSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        
        <h1 className="text-2xl font-bold text-white">Preventivo Accettato!</h1>
        
        <p className="text-slate-400 text-sm">
          Grazie! La tua accettazione e la firma sono state registrate con successo. Riceverai a breve una conferma.
        </p>

        <div className="pt-4 border-t border-slate-800">
          <Link 
            href="/"
            className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2 px-5 rounded-lg transition"
          >
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  )
}