import { createClient } from '@supabase/supabase-js'
import DashboardClient from './DashboardClient'

export const revalidate = 0

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: rawQuotes, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore recupero preventivi:', error)
  }

  // Normalizzazione pulita e sicura
  const normalizedQuotes = (rawQuotes || []).map((q: any) => ({
    ...q,
    base_price: typeof q.base_price === 'number' ? q.base_price : 0,
    id: q.id || q._id || q.quote_id || q.uuid
  }))

  return <DashboardClient initialQuotes={normalizedQuotes} />
}