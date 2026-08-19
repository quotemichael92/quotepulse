import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Qui va la logica per accettare il preventivo
    return NextResponse.json({ success: true, quoteId: id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante l accertazione del preventivo' },
      { status: 500 }
    );
  }
}