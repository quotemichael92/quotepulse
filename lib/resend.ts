import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendQuoteEmailParams {
  to: string;
  clientName: string;
  quoteNumber: string;
  pdfUrl?: string;
}

export async function sendQuoteEmail({ to, clientName, quoteNumber, pdfUrl }: SendQuoteEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'QuotePulse <noreply@quotepulse.it>',
      to: [to],
      subject: `Il tuo preventivo #${quoteNumber} è pronto`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Ciao ${clientName},</h2>
          <p>È stato generato un nuovo preventivo per te (Rif. #${quoteNumber}).</p>
          ${pdfUrl ? `<p>Puoi visualizzare e scaricare il documento al seguente link:</p><a href="${pdfUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Apri Preventivo</a>` : ''}
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Generato con QuotePulse</p>
        </div>
      `,
    });

    if (error) {
      console.error('Errore Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Errore imprevisto nell invio email:', err);
    return { success: false, error: err };
  }
}