'use client'

import { useState } from 'react'

export default function CopyLinkButton({ quoteId }: { quoteId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const url = `${window.location.origin}/p/${quoteId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
    >
      {copied ? '✓ Copiato!' : 'Copia Link'}
    </button>
  )
}