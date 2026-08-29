import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Qui recuperi i dati del preventivo dal tuo database o dallo storage in base all'ID (`id`)
  // Per ora usiamo dati di esempio mockati:
  const quoteData = {
    id,
    clientName: "Mario Rossi",
    projectName: "Sviluppo Piattaforma SaaS",
    totalAmount: "€ 2,500.00",
    date: new Date().toLocaleDateString('it-IT'),
    items: [
      { description: "Analisi e UX/UI Design", price: "€ 800.00" },
      { description: "Sviluppo Frontend & Backend (Next.js)", price: "€ 1,500.00" },
      { description: "Setup Database & Deploy", price: "€ 200.00" },
    ]
  };

  // Restituiamo una pagina HTML pulita, progettata per attivare automaticamente il dialogo di stampa del browser (PDF)
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
          ${quoteData.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: right;">${item.price}</td>
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
        // Avvia automaticamente la finestra di stampa al caricamento (opzionale)
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