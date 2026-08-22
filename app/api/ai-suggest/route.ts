import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { clientName, projectDescription } = await req.json()

    // Usiamo projectDescription o un fallback se vuoto
    const textPrompt = projectDescription || clientName || 'Progetto generico per professionista';

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
            content: 'Sei un assistente esperto per liberi professionisti. Restituisci la risposta in formato JSON con due chiavi: "projectDescription" (una descrizione ottimizzata del progetto) e "audioPitchNote" (una breve nota rompi-ghiaccio persuasiva).'
          },
          {
            role: 'user',
            content: `Genera i contenuti per il cliente "${clientName || 'Cliente'}" con questo obiettivo: "${textPrompt}"`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Errore chiamata OpenAI')
    }

    const content = JSON.parse(data.choices[0].message.content)

    return NextResponse.json({ 
      success: true, 
      projectDescription: content.projectDescription,
      audioPitchNote: content.audioPitchNote 
    }, { status: 200 })
    
  } catch (err: any) {
    console.error('Errore OpenAI:', err)
    return NextResponse.json({ error: err?.message || 'Errore interno' }, { status: 500 })
  }
}