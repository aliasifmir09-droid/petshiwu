import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const MESSAGES = [
  { text: '🚚 Free shipping on all orders over $49 — nationwide delivery' },
  { text: '🎁 20% off your first order — use code WELCOME20' },
  { text: '⭐ Over 10,000 products for dogs, cats, birds & more' },
  { text: '💬 Support available 7 days a week — we\'re here for you' },
]

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || !visible) return
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [paused, visible])

  if (!visible) return null

  const prev = () => setIndex(prev => (prev - 1 + MESSAGES.length) % MESSAGES.length)
  const next = () => setIndex(prev => (prev + 1) % MESSAGES.length)

  return (
    <div
      className="bg-green-600 text-white text-center text-sm font-medium relative flex items-center justify-center py-2 px-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button onClick={prev} className="absolute left-3 text-white/70 hover:text-white transition-colors" aria-label="Previous">
        <ChevronLeft size={16} />
      </button>

      <span>{MESSAGES[index].text}</span>

      <button onClick={next} className="absolute right-8 text-white/70 hover:text-white transition-colors" aria-label="Next">
        <ChevronRight size={16} />
      </button>

      <button onClick={() => setVisible(false)} className="absolute right-3 text-white/70 hover:text-white transition-colors" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
