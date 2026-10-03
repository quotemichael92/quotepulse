'use client'

import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [partitaIva, setPartitaIva] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              cognome,
              partita_iva: partitaIva,
            }
          }
        })

        if (error) {
          alert(error.message)
        } else {
          alert('Registrazione completata con successo! Effettua ora il login.')
          setIsSignUp(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          alert(error.message)
        } else if (data?.user) {
          const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', data.user.id)
            .maybeSingle()

          if (subError) {
            console.error('Errore nel recupero della sottoscrizione:', subError)
          }

          const hasActiveSub = subscription && (subscription.status === 'active' || subscription.status === 'trialing')
          
          if (hasActiveSub) {
            window.location.href = '/dashboard'
          } else {
            window.location.href = '/'
          }
        }
      }
    } catch (err: any) {
      console.error('Errore imprevisto durante l’autenticazione:', err)
      alert('Si è verificato un errore imprevisto durante l’accesso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Sfumature decorative di sfondo in stile QuotePulse */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10 my-8">
        
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              QuotePulse
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isSignUp ? 'Crea un account' : 'Accedi a QuotePulse'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Inserisci i tuoi dati anagrafici per iniziare' : 'Inserisci le tue credenziali per continuare'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {isSignUp && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required={isSignUp}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-[#07090e] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="Mario"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Cognome
                  </label>
                  <input
                    type="text"
                    required={isSignUp}
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    className="w-full bg-[#07090e] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Partita IVA / Codice Fiscale
                </label>
                <input
                  type="text"
                  required={isSignUp}
                  value={partitaIva}
                  onChange={(e) => setPartitaIva(e.target.value)}
                  className="w-full bg-[#07090e] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="P.IVA o Codice Fiscale"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#07090e] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="tua@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#07090e] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/35 transition duration-200 text-sm disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? 'Elaborazione in corso...' : isSignUp ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-400 hover:text-purple-400 transition cursor-pointer"
          >
            {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>

      </div>

    </main>
  )
}