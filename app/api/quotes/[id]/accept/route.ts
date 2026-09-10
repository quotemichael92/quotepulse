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

    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    await supabase
      .from('quotes')
      .update({ status: 'accepted', client_notes: clientNotes })
      .eq('id', id);

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

    if (quote.client_email) {
      await resend.emails.send({
        from: 'QuotePulse <onboarding@resend.dev>',
        to: [quote.client_email],
        subject: `Conferma accettazione - Proposta #${id.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #111;">
            <h2>Grazie per aver accettato la proposta! 🤝</h2>
            <p>Gentile <strong>${quote.client_name || 'Cliente'}</strong>,</p>
            <p>Confermiamo di aver registrato correttamente la tua accettazione per la proposta commerciale #${id.slice(0, 8)}.</p>
            <p><strong>Importo concordato:</strong> € ${amount}</p>
            ${clientNotes ? `<p><strong>Tue note:</strong> ${clientNotes}</p>` : ''}
            <p>Il professionista ti ricontatterà presto per procedere con i prossimi passi.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">Notifica automatica generata da QuotePulse.</p>
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