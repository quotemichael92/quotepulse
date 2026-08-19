import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { Resend } from 'resend'
import QuotePdfTemplate from '@/lib/pdf/QuotePdfTemplate'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const clientEmail = session.customer_details?.email

    const metadata = session.metadata || {}
    const signatureData = metadata.signatureData
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0

    // Genera il PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePdfTemplate, {
        quote: { id: metadata.quoteId },
        options: JSON.parse(metadata.options || '[]'),
        totalAmount,
        signatureData,
        clientNotes: metadata.clientNotes,
      })
    )

    // Invia la mail con l'allegato
    if (clientEmail) {
      await resend.emails.send({
        from: 'Preventivi ',
        to: [clientEmail],
        subject: 'Conferma Preventivo Firmato e Ricevuta di Pagamento',
        html: `Grazie per la fiducia! In allegato trovi la copia firmata del preventivo e la ricevuta di pagamento.`,
        attachments: [
          {
            filename: `Preventivo_${metadata.quoteId || 'Confermato'}.pdf`,
            content: pdfBuffer,
          },
        ],
      })
    }
  }

  return NextResponse.json({ received: true })
}