import InteractiveQuoteView from './InteractiveQuoteView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InteractiveQuoteView quoteId={id} />;
}