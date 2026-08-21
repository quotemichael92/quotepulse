import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Inserisci una descrizione' }, { status: 400 })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Errore chiamata OpenAI')
    }

    const text = data.choices[0].message.content

    return NextResponse.json({ success: true, suggestion: text }, { status: 200 })
  } catch (err: any) {
    console.error('Errore OpenAI:', err)
    return NextResponse.json({ error: err?.message || 'Errore interno' }, { status: 500 })
  }
}