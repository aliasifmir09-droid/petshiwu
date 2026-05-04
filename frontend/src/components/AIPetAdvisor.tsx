import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM_PROMPT = `You are PetShiwu's friendly AI Pet Advisor. You help customers find the right pet products from petshiwu.com.

Your role:
- Ask about the customer's pet (species, breed, age, health conditions if relevant)
- Recommend specific product categories from the store
- Give short, friendly, practical advice
- Always end with a specific product suggestion or category to browse
- Keep responses concise (2-4 sentences max)
- Use a warm, caring tone

PetShiwu sells: food, treats, toys, beds, grooming, accessories, supplements for dogs, cats, birds, reptiles, fish, and small pets.

Do NOT make up specific product names or prices. Recommend categories instead.`

async function askGemini(messages: Message[], userMessage: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    return "I'm not fully set up yet — please add the VITE_GEMINI_API_KEY to your .env file!"
  }

  const history = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }))

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      ...history,
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 200,
    },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error('API request failed')

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't get a response. Please try again."
}

const STARTER_PROMPTS = [
  'My dog has itchy skin — what food should I try?',
  'What do I need for a new kitten?',
  'Best toys for a senior dog?',
  'What supplements help with joint pain?',
]

export default function AIPetAdvisor() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm PetShiwu's AI Pet Advisor 🐾 Tell me about your pet and I'll help you find exactly what they need!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    setInput('')
    const userMsg: Message = { role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const reply = await askGemini(messages, msg)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: "Sorry, something went wrong. Please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const showStarters = messages.length === 1

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3 flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95"
        >
          <Sparkles size={18} />
          <span className="text-sm font-semibold">Ask AI Pet Advisor</span>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden"
          style={{ height: 480 }}
        >
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">AI Pet Advisor</p>
              <p className="text-xs text-blue-200">Powered by Gemini</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {msg.role === 'assistant'
                    ? <Bot size={12} className="text-blue-600" />
                    : <User size={12} className="text-gray-500" />}
                </div>
                <div className={`max-w-[78%] text-sm px-3 py-2 rounded-2xl leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}

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

            {showStarters && (
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-xs text-gray-400 text-center">Try asking:</p>
                {STARTER_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs text-left bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 px-3 py-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about your pet..."
              className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl px-3 py-2 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
