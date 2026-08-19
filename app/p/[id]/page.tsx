import InteractiveQuoteView from './InteractiveQuoteView'

export default function Page({ params }: { params: { id: string } }) {
  return <InteractiveQuoteView params={params} />
}