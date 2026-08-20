import { createClient } from '@supabase/supabase-js'
import DashboardClient from './DashboardClient'

// Forza il rendering dinamico per avere sempre i dati aggiornati
export const revalidate = 0

export default async function DashboardPage() {
  // Inizializzazione client Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Recupero dati dalla tabella 'quotes'
  const { data: rawQuotes, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore durante il recupero dei preventivi da Supabase:', error)
  }

  // Normalizzazione dei dati: 
  // Assicuriamo che 'base_price' sia sempre presente, 
  // cercando tra i possibili nomi di colonne usati in passato o nel DB
  const normalizedQuotes = (rawQuotes || []).map((q: any) => ({
    ...q,
    // Qui controlla se 'base_price' esiste, altrimenti prova 'price', 'amount' o imposta a 0
    base_price: Number(q.base_price ?? q.price ?? q.amount ?? 0),
    // Garantiamo che l'id sia leggibile
    id: q.id || q._id || q.quote_id || q.uuid
  }))

  return <DashboardClient initialQuotes={normalizedQuotes} />
}