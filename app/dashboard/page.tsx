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
    const clientEmailForm = formData.get('clientEmail') as string;

    // Recupera i dati del preventivo dal database per avere le info del cliente
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    // Aggiorna lo stato del preventivo nel database impostandolo a SIGNED per allinearlo alla dashboard
    await supabase
      .from('quotes')
      .update({ status: 'SIGNED', client_notes: clientNotes })
      .eq('id', id);

    // Determina l'email del destinatario (dal DB o dal form)
    const recipientEmail = quote.client_email || quote.clientEmail || clientEmailForm;

    if (recipientEmail) {
      // Invio della notifica email al cliente tramite Resend
      await resend.emails.send({
        from: 'QuotePulse <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `Preventivo Accettato - #${id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #111;">
            <h2>Preventivo Accettato con Successo! 🎉</h2>
            <p>Gentile <strong>${quote.client_name || 'Cliente'}</strong>, abbiamo registrato correttamente l'accettazione della proposta commerciale.</p>
            <p><strong>Importo totale:</strong> € ${amount}</p>
            ${clientNotes ? `<p><strong>Tue note:</strong> ${clientNotes}</p>` : ''}
            <p style="margin-top: 30px; font-size: 12px; color: #666;">Generato automaticamente tramite QuotePulse Deal Room.</p>
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