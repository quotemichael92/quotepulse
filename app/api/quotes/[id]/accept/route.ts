import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    const amount = formData.get('amount') as string;
    const clientNotes = formData.get('clientNotes') as string;

    // Recupera i dati del preventivo dal database
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    // Aggiorna lo stato del preventivo nel database
    await supabase
      .from('quotes')
      .update({ status: 'accepted', client_notes: clientNotes })
      .eq('id', id);

    // Prende l'email del professionista salvata nel record del preventivo 
    // (sostituisci 'professional_email' con il nome esatto della colonna che usi nel tuo DB)
    const professionalEmail = quote.professional_email || quote.user_email || quote.creator_email;

    if (professionalEmail) {
      await resend.emails.send({
        from: 'QuotePulse <onboarding@resend.dev>',
        to: [professionalEmail],
        subject: `🎉 Nuovo preventivo accettato! #${id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #111;">
            <h2>Il cliente ha accettato il preventivo! 🚀</h2>
            <p>Il cliente <strong>${quote.client_name || 'Cliente'}</strong> ha appena firmato e accettato la proposta commerciale #${id.slice(0, 8)}.</p>
            <p><strong>Importo concordato:</strong> € ${amount}</p>
            ${clientNotes ? `<p><strong>Note lasciate dal cliente:</strong> ${clientNotes}</p>` : ''}
            <p style="margin-top: 30px; font-size: 12px; color: #666;">Notifica automatica generata da QuotePulse Deal Room.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, quoteId: id });
  } catch (error) {
    console.error('Errore invio email/accettazione:', error);
    return NextResponse.json(
      { error: 'Errore durante l accettazione del preventivo' },
      { status: 500 }
    );
  }
}