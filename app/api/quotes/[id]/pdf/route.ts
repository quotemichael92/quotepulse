import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Assicurati di usare il client Supabase configurato nel progetto

// Inizializza il client Supabase (o usa il client che hai già nel progetto)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Recupera il preventivo reale dal database usando l'ID
  const { data: quote, error } = await supabase
    .from('quotes') // Sostituisci 'quotes' con il nome esatto della tua tabella su Supabase se è diverso
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quote) {
    return new NextResponse('Preventivo non trovato', { status: 404 });
  }

  // Usiamo i dati reali presi dal database
  const quoteData = {
    id: quote.id,
    clientName: quote.client_name || quote.clientName || "Cliente",
    projectName: quote.project_description || quote.projectName || "Progetto SaaS",
    totalAmount: `€ ${Number(quote.amount || quote.total_amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
    date: new Date(quote.created_at || Date.now()).toLocaleDateString('it-IT'),
    items: quote.items || [
      { description: quote.project_description || "Sviluppo e configurazione piattaforma", price: `€ ${Number(quote.amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` }
    ]
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>Preventivo #${quoteData.id}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .details { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f9f9f9; }
        .total { margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Preventivo - QuotePulse</h1>
      <div class="details">
        <p><strong>Cliente:</strong> ${quoteData.clientName}</p>
        <p><strong>Progetto:</strong> ${quoteData.projectName}</p>
        <p><strong>Data:</strong> ${quoteData.date}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Descrizione</th>
            <th style="text-align: right;">Importo</th>
          </tr>
        </thead>
        <tbody>
          ${Array.isArray(quoteData.items) ? quoteData.items.map((item: any) => `
            <tr>
              <td>${item.description || item}</td>
              <td style="text-align: right;">${item.price || quoteData.totalAmount}</td>
            </tr>
          `).join('') : `
            <tr>
              <td>${quoteData.projectName}</td>
              <td style="text-align: right;">${quoteData.totalAmount}</td>
            </tr>
          `}
        </tbody>
      </table>
      <div class="total">
        Totale: ${quoteData.totalAmount}
      </div>
      <div class="no-print" style="margin-top: 40px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">🖨️ Stampa / Salva come PDF</button>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}