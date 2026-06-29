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
  petType?: string
}

interface PetProfile {
  petName: string
  petBirthday: string
  ownerEmail: string
}

const STORAGE_PREFIX = 'petshiwu_profile_'

function loadProfile(): PetProfile | null {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith(STORAGE_PREFIX))
    if (!key) return null
    return JSON.parse(localStorage.getItem(key)!)
  } catch {
    return null
  }
}

function saveProfile(profile: PetProfile) {
  try {
    const key = STORAGE_PREFIX + profile.ownerEmail.toLowerCase().trim()
    localStorage.setItem(key, JSON.stringify(profile))
  } catch {}
}

// 4 rotating prompt sets — cycles every 6 hours
// Mix of: pet health, platform/orders, species (birds/fish/reptiles), new pet, seasonal, training
const PROMPT_SETS = [
  [
    'My dog has itchy skin — what food should I try?',
    'How does free shipping work?',
    'What do I need for a new kitten?',
    'How do I track my order?',
  ],
  [
    'Best food for a senior dog?',
    'How do I return something?',
    'What do parakeets need to stay healthy?',
    'How do I get the 10% off discount?',
  ],
  [
    'What supplements help with joint pain in dogs?',
    'How do I set up my first aquarium?',
    'What do I need to bring a new puppy home?',
    'How do I use a discount code?',
  ],
  [
    'How do I keep my dog safe in summer heat?',
    'What does a bearded dragon need?',
    'How do I crate train my puppy?',
    'Can I cancel or change my order?',
  ],
]

// Rotate by 6-hour block so returning users see variety
const getStarterPrompts = () => {
  const block = Math.floor(new Date().getHours() / 6) % PROMPT_SETS.length
  return PROMPT_SETS[block]
}

function buildSystemPrompt(profile: PetProfile | null): string {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const base = `You are Petshiwu's expert AI Pet Advisor. You work for petshiwu.com, a premium US pet e-commerce store selling food, toys, and supplies. Be warm, concise (2-4 sentences), and helpful. Today: ${today}.`

  if (!profile) return base + `\n\nNo customer profile on file yet.`

  const isBirthday = (() => {
    try {
      const bd = new Date(profile.petBirthday)
      const now = new Date()
      return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate()
    } catch { return false }
  })()

  return base + `

CUSTOMER PROFILE (already saved — NEVER ask for this info again):
- Pet name: ${profile.petName}
- Pet birthday: ${new Date(profile.petBirthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

RULES:
- Do NOT ask for pet name or birthday — already saved.
- Use ${profile.petName}'s name naturally in conversation.
${isBirthday ? `- TODAY IS ${profile.petName}'s BIRTHDAY! 🎂 Wish them happy birthday and mention code BDAYGIFT for 15% off!` : ''}`
}

async function askBackend(
  messages: Message[],
  userMessage: string,
  petContext: PetContext,
  petProfile: PetProfile | null
): Promise<{ text: string; products: Product[] }> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/v1/ai-advisor/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, userMessage, petContext, petProfile })
  })
  if (!res.ok) throw new Error('Backend request failed')
  const data = await res.json()
  return { text: data.data.reply, products: data.data.products || [] }
}

function getImage(product: Product): string {
  return product.images?.length > 0 && product.images[0].url ? product.images[0].url : '/logo.png'
}

function formatPrice(num: number): string {
  return '$' + num.toFixed(2)
}

function isTodayBirthday(dateStr: string): boolean {
  try {
    const bd = new Date(dateStr)
    const now = new Date()
    return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate()
  } catch { return false }
}

// ─── One-time Pet Info Form ───────────────────────────────────────
function PetInfoForm({ onSave }: { onSave: (p: PetProfile) => void }) {
  const [petName, setPetName] = useState('')
  const [petBirthday, setPetBirthday] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [err, setErr] = useState('')

  function handleSave() {
    if (!petName.trim()) { setErr("Please enter your pet's name."); return }
    if (!petBirthday) { setErr("Please enter your pet's birthday."); return }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) { setErr('Please enter a valid email.'); return }
    setErr('')
    const profile: PetProfile = { petName: petName.trim(), petBirthday, ownerEmail: ownerEmail.trim().toLowerCase() }
    saveProfile(profile)
    onSave(profile)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
      <div className="text-center">
        <div className="text-3xl mb-2">🐾</div>
        <p className="text-sm font-semibold text-gray-800">Tell us about your pet once</p>
        <p className="text-xs text-gray-400 mt-1">We'll remember — you'll never be asked again!</p>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Pet's Name *</label>
          <input type="text" placeholder="e.g. Buddy" value={petName} onChange={e => setPetName(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Pet's Birthday *</label>
          <input type="date" value={petBirthday} onChange={e => setPetBirthday(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-700" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Your Email *</label>
          <input type="email" placeholder="to save your profile" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400" />
        </div>
        {err && <p className="text-xs text-red-500 font-semibold -mt-1">{err}</p>}
        <button onClick={handleSave} disabled={!petName || !petBirthday || !ownerEmail}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
          Save & Start Chatting 🐾
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export default function AIPetAdvisor() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<PetProfile | null | false>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [petContext] = useState<PetContext>({})
  const [savedToast, setSavedToast] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load profile: prefer saved pets from API (logged-in users), fall back to localStorage
  useEffect(function () {
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/v1/users/me/pets', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          const pets = data?.data
          if (Array.isArray(pets) && pets.length > 0) {
            const p = pets[0]
            setProfile({
              petName: p.petName,
              petBirthday: p.birthday || '',
              ownerEmail: ''
            })
          } else {
            setProfile(loadProfile() ?? false)
          }
        })
        .catch(() => setProfile(loadProfile() ?? false))
    } else {
      setProfile(loadProfile() ?? false)
    }
  }, [])

  // ✅ Listen for banner button — opens chat directly
  useEffect(function () {
    function handleOpen() { setOpen(true) }
    window.addEventListener('openPetAdvisor', handleOpen)
    return () => window.removeEventListener('openPetAdvisor', handleOpen)
  }, [])

  // Set initial greeting once profile is known
  useEffect(function () {
    if (profile === null) return
    if (profile === false) { setMessages([]); return }
    const birthday = isTodayBirthday(profile.petBirthday)
    const greeting = birthday
      ? `🎂 Happy Birthday ${profile.petName}!! Use code BDAYGIFT for 15% off today! How can I help you celebrate?`
      : `Hi! Welcome back 🐾 How can I help ${profile.petName} today?`
    setMessages([{ role: 'assistant', text: greeting }])
  }, [profile])

  useEffect(function () {
    if (open) {
      setTimeout(function () { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
      inputRef.current?.focus()
    }
  }, [open, messages])

  function handleProfileSaved(p: PetProfile) {
    setProfile(p)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 3000)
    const birthday = isTodayBirthday(p.petBirthday)
    const greeting = birthday
      ? `🎂 Happy Birthday ${p.petName}!! Use code BDAYGIFT for 15% off today! How can I help you celebrate?`
      : `Nice to meet ${p.petName}! 🐾 I've saved their info — I'll never ask again! How can I help today?`
    setMessages([{ role: 'assistant', text: greeting }])
  }

  async function send(text?: string) {
    const msg = (text !== undefined ? text : input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', text: msg }
    setMessages(function (prev) { return prev.concat([userMsg]) })
    setLoading(true)
    try {
      const result = await askBackend(messages, msg, petContext, profile && profile !== false ? profile : null)
      const assistantMsg: Message = { role: 'assistant', text: result.text, products: result.products }
      setMessages(function (prev) { return prev.concat([assistantMsg]) })
    } catch {
      setMessages(function (prev) { return prev.concat([{ role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }]) })
    } finally {
      setLoading(false)
    }
  }

  function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
    e.currentTarget.src = '/logo.png'
  }

  const showForm = profile === false
  const isReady = profile !== null && profile !== false

  return (
    <div>
      {!open && (
        <button onClick={function () { setOpen(true) }}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3 flex items-center gap-2 shadow-lg transition-all duration-200 active:scale-95">
          <Sparkles size={18} />
          <span className="text-sm font-semibold">Ask AI Pet Advisor</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden" style={{ height: '540px' }}>

          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">AI Pet Advisor</p>
              <p className="text-xs text-blue-200">
                {isReady ? `🐾 ${(profile as PetProfile).petName}'s profile saved` : 'Powered by Gemini'}
              </p>
            </div>
            {savedToast && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold">✓ Saved!</span>
            )}
            <button onClick={function () { setOpen(false) }} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Form or Chat */}
          {showForm ? (
            <PetInfoForm onSave={handleProfileSaved} />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
                {messages.map(function (msg, i) {
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
                          {msg.products.map(function (product) {
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
                    {getStarterPrompts().map(function (p) {
                      return (
                        <button key={p} onClick={function () { send(p) }}
                          className="text-xs text-left bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                          {p}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <div className="border-t border-gray-100 px-3 py-3 flex gap-2 flex-shrink-0">
                <input ref={inputRef} type="text" value={input}
                  onChange={function (e) { setInput(e.target.value) }}
                  onKeyDown={function (e) { if (e.key === 'Enter') send() }}
                  placeholder="Ask about your pet..."
                  className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
                  disabled={loading} />
                <button onClick={function () { send() }} disabled={!input.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl px-3 py-2 transition-colors">
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
