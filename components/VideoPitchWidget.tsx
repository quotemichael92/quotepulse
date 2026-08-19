'use client'

import { useState } from 'react'

interface VideoPitchWidgetProps {
  videoUrl?: string | null
}

export default function VideoPitchWidget({ videoUrl }: VideoPitchWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!videoUrl) return null

  const getEmbedUrl = (url: string) => {
    let formattedUrl = url.trim()

    // Loom
    if (formattedUrl.includes('loom.com/share/')) {
      return formattedUrl.replace('loom.com/share/', 'loom.com/embed/')
    }

    // YouTube tu.be
    if (formattedUrl.includes('youtu.be/')) {
      const id = formattedUrl.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${id}`
    }

    // YouTube watch?v=
    if (formattedUrl.includes('youtube.com/watch')) {
      const urlObj = new URL(formattedUrl)
      const v = urlObj.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }

    // YouTube shorts
    if (formattedUrl.includes('youtube.com/shorts/')) {
      const id = formattedUrl.split('youtube.com/shorts/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${id}`
    }

    return formattedUrl
  }

  const embedUrl = getEmbedUrl(videoUrl)

  return (
    <div className="fixed bottom-6 left-6 z-50 print:hidden">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-full shadow-2xl transition transform hover:scale-105 border border-blue-400/30"
        >
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Ascolta la presentazione</span>
          <span className="text-lg">▶</span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 w-80 sm:w-96 space-y-3 relative animate-in fade-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-slate-200">Messaggio Video del Freelance</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-800">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  )
}