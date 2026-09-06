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
      <title>Proposta Commerciale #${quoteData.id.slice(0, 8)}</title>
      <style>
        :root {
          --primary: #0f172a;
          --accent: #2563eb;
          --slate-light: #f8fafc;
          --border: #e2e8f0;
          --text: #334155;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
          padding: 50px; 
          color: var(--text); 
          max-width: 800px; 
          margin: 0 auto; 
          background-color: #ffffff;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--primary);
          padding-bottom: 24px;
          margin-bottom: 30px;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.5px;
        }
        .brand span {
          color: var(--accent);
        }
        .doc-info {
          text-align: right;
          font-size: 13px;
          color: #64748b;
        }
        .doc-info strong {
          color: var(--primary);
        }
        .client-card {
          background-color: var(--slate-light);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .client-card h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
        }
        .client-card p {
          margin: 4px 0;
          font-size: 15px;
          color: var(--primary);
          font-weight: 500;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
        }
        th, td { 
          padding: 14px 16px; 
          text-align: left; 
          border-bottom: 1px solid var(--border); 
          font-size: 14px;
        }
        th { 
          background-color: var(--slate-light); 
          color: var(--primary);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.8px;
        }
        tbody tr:nth-child(even) {
          background-color: #fafbfd;
        }
        .total-box {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .total-card {
          background: var(--primary);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          text-align: right;
          min-width: 240px;
        }
        .total-card .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .total-card .amount {
          font-size: 22px;
          font-weight: 800;
        }
        .footer-note {
          margin-top: 60px;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
          border-top: 1px solid var(--border);
          padding-top: 20px;
        }
        .no-print { 
          margin-top: 40px; 
          text-align: center; 
        }
        .print-btn { 
          padding: 12px 24px; 
          background: var(--accent); 
          color: #fff; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 14px; 
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          transition: background 0.2s;
        }
        .print-btn:hover {
          background: #1d4ed8;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
          .total-card { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .client-card { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          Quote<span>Pulse</span>
        </div>
        <div class="doc-info">
          <div>Proposta ID: <strong>#${quoteData.id.slice(0, 8)}</strong></div>
          <div>Data emissione: <strong>${quoteData.date}</strong></div>
        </div>
      </div>

      <div class="client-card">
        <h3>Committente</h3>
        <p>${quoteData.clientName}</p>
        <p style="font-size: 13px; color: #64748b; font-weight: normal; margin-top: 6px;">Oggetto: ${quoteData.projectName}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrizione Servizi & Moduli</th>
            <th style="text-align: right;">Importo</th>
          </tr>
        </thead>
        <tbody>
          ${quoteData.items.map((item) => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: right; font-weight: 500;">€ ${item.price.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-card">
          <div class="label">Totale Proposta</div>
          <div class="amount">${quoteData.totalAmount}</div>
        </div>
      </div>

      <div class="footer-note">
        Documento generato digitalmente tramite piattaforma QuotePulse • Validità 30 giorni dalla data di emissione.
      </div>

      <div class="no-print">
        <button onclick="window.print()" class="print-btn">🖨️ Stampa o Salva PDF</button>
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