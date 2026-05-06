import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader2, Sparkles, ShoppingCart } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  text: string
  products?: Product[]
}

interface Product {
  _id: string
  name: string
  price: number
  salePrice?: number
  images: Array<{ url: string }>
  slug: string
}

interface PetContext {
  species?: string
  breed?: string
  age?: string
  issue?: string
}

const STARTER_PROMPTS = [
  'My dog has itchy skin — what food should I try?',
  'What do I need for a new kitten?',
  'Best toys for a senior dog?',
  'What supplements help with joint pain?'
]

async function askBackend(messages: Message[], userMessage: string, petContext: PetContext): Promise<{ text: string; products: Product[] }> {
  const res = await fetch('/api/v1/ai-advisor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userMessage, petContext })
  })
  if (!res.ok) throw new Error('Backend request failed')
  const data = await res.json()
  return { text: data.data.reply, products: data.data.products || [] }
}

function getImage(product: Product): string {
  if (product.images && product.images.length > 0 && product.images[0].url) {
    return product.images[0].url
  }
  return '/logo.png'
}

function formatPrice(num: number): string {
  return '$' + num.toFixed(2)
}

export default function AIPetAdvisor() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm PetShiwu's AI Pet Advisor 🐾 Tell me about your pet and I'll help you find exactly what they need!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [petContext, setPetContext] = useState<PetContext>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(function() {
    if (open) {
      setTimeout(function() {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      if (inputRef.current) inputRef.current.focus()
    }
  }, [open, messages])

  async function send(text?: string) {
    const msg = (text !== undefined ? text : input).trim()
    if (!msg || loading) return

    setInput('')
    const userMsg: Message = { role: 'user', text: msg }
    setMessages(function(prev) { return prev.concat([userMsg]) })
    setLoading(true)

    try {
      const result = await askBackend(messages, msg, petContext)
      const assistantMsg: Message = { role: 'assistant', text: result.text, products: result.products }
      setMessages(function(prev) { return prev.concat([assistantMsg]) })
    } catch {
      const errMsg: Message = { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }
      setMessages(function(prev) { return prev.concat([errMsg]) })
    } finally {
      setLoading(false)
    }
  }

  function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
    const target = e.currentTarget
    target.src = '/logo.png'
  }

  return (
    <div>
      {!open && (
        <button
          onClick={function() { setOpen(true) }}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3 flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95"
        >
          <Sparkles size={18} />
          <span className="text-sm font-semibold">Ask AI Pet Advisor</span>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden"
          style={{ height: '540px' }}
        >
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">AI Pet Advisor</p>
              <p className="text-xs text-blue-200">Powered by Gemini</p>
            </div>
            <button onClick={function() { setOpen(false) }} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
            {messages.map(function(msg, i) {
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {msg.role === 'assistant' ? <Bot size={12} className="text-blue-600" /> : <User size={12} className="text-gray-500" />}
                    </div>
                    <div className={`max-w-[78%] text-sm px-3 py-2 rounded-2xl leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>

                  {msg.products && msg.products.length > 0 && (
                    <div className="ml-8 grid grid-cols-2 gap-2 mt-1">
                      {msg.products.map(function(product) {
                        const imgSrc = getImage(product)
                        const displayPrice = product.salePrice ? formatPrice(product.salePrice) : formatPrice(product.price)
                        const originalPrice = product.salePrice ? formatPrice(product.price) : null
                        return (
                          <a key={product._id} href={'/products/' + product.slug} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow block">
                            <img src={imgSrc} alt={product.name} className="w-full h-20 object-cover" onError={handleImageError} />
                            <div className="p-2">
                              <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-xs font-bold text-blue-600">{displayPrice}</span>
                                {originalPrice && <span className="text-xs text-gray-400 line-through">{originalPrice}</span>}
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-1.5 bg-blue-600 text-white rounded-lg px-2 py-1">
                                <ShoppingCart size={9} />
                                <span className="text-xs font-semibold">View Product</span>
                              </div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-blue-600" />
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-tl-sm">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-xs text-gray-400 text-center">Try asking:</p>
                {STARTER_PROMPTS.map(function(p) {
                  return (
                    <button key={p} onClick={function() { send(p) }} className="text-xs text-left bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                      {p}
                    </button>
                  )
                })}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 px-3 py-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={function(e) { setInput(e.target.value) }}
              onKeyDown={function(e) { if (e.key === 'Enter') send() }}
              placeholder="Ask about your pet..."
              className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              onClick={function() { send() }}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl px-3 py-2 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
