import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('id');
    const userId = searchParams.get('user_id'); // ID utente passato dalla dashboard

    if (quoteId) {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, quote: data });
    }

    let query = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtriamo rigorosamente per l'utente proprietario tramite user_id
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, quotes: data });

  } catch (err: any) {
    console.error('Errore API quotes GET:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}