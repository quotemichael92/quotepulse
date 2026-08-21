import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Inserisci una descrizione' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Sei un assistente esperto per liberi professionisti. Aiuti a strutturare preventivi dettagliati.'
        },
        {
          role: 'user',
          content: `Genera una proposta dettagliata per: "${prompt}"`
        }
      ],
      temperature: 0.7,
    })

    const text = completion.choices[0].message.content

    return NextResponse.json({ success: true, suggestion: text }, { status: 200 })
  } catch (err: any) {
    console.error('Errore OpenAI:', err)
    return NextResponse.json({ error: err?.message || 'Errore interno' }, { status: 500 })
  }
}