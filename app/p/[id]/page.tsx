import InteractiveQuoteView from './InteractiveQuoteView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <InteractiveQuoteView quoteId={id} />
      </div>
    </main>
  );
}