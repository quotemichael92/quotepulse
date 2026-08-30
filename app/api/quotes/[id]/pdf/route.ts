import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quote) {
    return new NextResponse('Preventivo non trovato', { status: 404 });
  }

  const basePrice = Number(quote.amount || quote.base_price || 0);
  const projectDesc = quote.project_description || quote.projectName || "Sviluppo piattaforma web";
  
  // Ricostruiamo la lista delle voci (Servizio Base + Opzioni)
  const items: { description: string; price: number }[] = [
    { description: projectDesc, price: basePrice }
  ];

  if (Array.isArray(quote.options)) {
    quote.options.forEach((opt: any) => {
      if (typeof opt === 'string') {
        items.push({ description: opt, price: 150 });
      } else if (opt) {
        items.push({ 
          description: opt.title || opt.name || 'Opzione aggiuntiva', 
          price: Number(opt.price ?? opt.cost ?? 150) 
        });
      }
    });
  }

  const calculatedTotal = items.reduce((sum, item) => sum + item.price, 0);

  const quoteData = {
    id: quote.id,
    clientName: quote.client_name || quote.clientName || "Cliente",
    projectName: projectDesc,
    date: new Date(quote.created_at || Date.now()).toLocaleDateString('it-IT'),
    items,
    totalAmount: `€ ${calculatedTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
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
          ${quoteData.items.map((item) => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: right;">€ ${item.price.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
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