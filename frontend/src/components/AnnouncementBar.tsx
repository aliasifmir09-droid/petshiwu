import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ANNOUNCEMENT_SHIPPING } from '@/utils/deliveryZones'

const MESSAGES = [
  { text: ANNOUNCEMENT_SHIPPING },
  { text: 'FREEDOM20 — 20% off first order, max $10.' },
  { text: '365-day returns on unused items' },
  { text: 'Repeat orders: 10% off, max $10.' },
  { text: 'Secure checkout with PayPal or card' },
  { text: 'Call +1 (800) 259-2605 or email support@petshiwu.com' },
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
      className="relative flex items-center justify-center bg-[#1E3A8A] px-10 py-2.5 text-center text-[13px] font-normal text-white"
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
