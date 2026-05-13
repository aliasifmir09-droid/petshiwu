// ================================================================
// FILE: frontend/src/components/AIChatWidget.tsx
// FIXES FROM YOUR ORIGINAL:
//  1. Calls YOUR backend /api/ai/chat — API key never exposed
//     ⚠️  If your route is mounted differently, change API_URL below
//  2. Sends correct body: { messages, userMessage, petContext }
//  3. Fixes message format: { role, text } not { role, content }
//  4. Collects petName + birthday from user, saves to petContext
//  5. Shows product cards when Pawsy recommends products
//  6. Shows birthday celebration banner with BDAYGIFT code
//  7. All UI, dog SVGs, and animations are unchanged
// ================================================================

import { useState, useRef, useEffect } from 'react';

// ⚠️  Change this if your route is mounted at a different base path
// Check your backend/src/index.ts for: app.use('/api/...', aiAdvisorRouter)
const API_URL = '/api/ai-advisor/chat';

// ─── Types ────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  text: string; // ← FIXED: was "content" before, backend needs "text"
}

interface PetContext {
  petName?: string;
  birthday?: string;
  parentName?: string;
  parentEmail?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  salePrice?: number;
  images?: string[];
  slug?: string;
  brand?: string;
  category?: string;
}

// ─── SVG Components (completely unchanged from your original) ─────
const DogFace = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="42" r="28" fill="#F5A623"/>
    <ellipse cx="18" cy="22" rx="10" ry="14" fill="#E8941A" transform="rotate(-15 18 22)"/>
    <ellipse cx="62" cy="22" rx="10" ry="14" fill="#E8941A" transform="rotate(15 62 22)"/>
    <ellipse cx="18" cy="23" rx="6" ry="9" fill="#F5C16C" transform="rotate(-15 18 23)"/>
    <ellipse cx="62" cy="23" rx="6" ry="9" fill="#F5C16C" transform="rotate(15 62 23)"/>
    <ellipse cx="40" cy="50" rx="18" ry="14" fill="#F5C16C"/>
    <circle cx="30" cy="36" r="6" fill="white"/>
    <circle cx="31" cy="36" r="3.5" fill="#2C1810"/>
    <circle cx="32" cy="34.5" r="1.2" fill="white"/>
    <circle cx="50" cy="36" r="6" fill="white"/>
    <circle cx="51" cy="36" r="3.5" fill="#2C1810"/>
    <circle cx="52" cy="34.5" r="1.2" fill="white"/>
    <ellipse cx="40" cy="47" rx="5" ry="3.5" fill="#2C1810"/>
    <circle cx="38" cy="47.5" r="1" fill="#1a0e0a"/>
    <circle cx="42" cy="47.5" r="1" fill="#1a0e0a"/>
    <path d="M36 52 Q40 56 44 52" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <ellipse cx="40" cy="55" rx="4" ry="3" fill="#FF6B8A"/>
    <ellipse cx="22" cy="46" rx="5" ry="3" fill="#FFB3C1" opacity="0.6"/>
    <ellipse cx="58" cy="46" rx="5" ry="3" fill="#FFB3C1" opacity="0.6"/>
  </svg>
);

const DogAvatar = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="42" r="28" fill="#F5A623"/>
    <ellipse cx="18" cy="22" rx="10" ry="14" fill="#E8941A" transform="rotate(-15 18 22)"/>
    <ellipse cx="62" cy="22" rx="10" ry="14" fill="#E8941A" transform="rotate(15 62 22)"/>
    <ellipse cx="18" cy="23" rx="6" ry="9" fill="#F5C16C" transform="rotate(-15 18 23)"/>
    <ellipse cx="62" cy="23" rx="6" ry="9" fill="#F5C16C" transform="rotate(15 62 23)"/>
    <ellipse cx="40" cy="50" rx="18" ry="14" fill="#F5C16C"/>
    <circle cx="30" cy="36" r="6" fill="white"/>
    <circle cx="31" cy="36" r="3.5" fill="#2C1810"/>
    <circle cx="32" cy="34.5" r="1.2" fill="white"/>
    <circle cx="50" cy="36" r="6" fill="white"/>
    <circle cx="51" cy="36" r="3.5" fill="#2C1810"/>
    <circle cx="52" cy="34.5" r="1.2" fill="white"/>
    <ellipse cx="40" cy="47" rx="5" ry="3.5" fill="#2C1810"/>
    <path d="M36 52 Q40 56 44 52" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <ellipse cx="40" cy="55" rx="4" ry="3" fill="#FF6B8A"/>
    <ellipse cx="22" cy="46" rx="5" ry="3" fill="#FFB3C1" opacity="0.6"/>
    <ellipse cx="58" cy="46" rx="5" ry="3" fill="#FFB3C1" opacity="0.6"/>
  </svg>
);

const SendIcon = ({ color = '#fff' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Product Card ─────────────────────────────────────────────────
const ProductCard = ({ product }: { product: Product }) => {
  const displayPrice = product.salePrice && product.salePrice < product.price
    ? product.salePrice
    : product.price;
  const wasPrice = product.salePrice && product.salePrice < product.price
    ? product.price
    : null;

  return (
    <a
      href={`https://www.petshiwu.com/products/${product.slug || ''}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', gap: '10px', padding: '10px',
        background: '#fff', border: '1.5px solid #FFD98E',
        borderRadius: '12px', textDecoration: 'none',
        alignItems: 'center', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#FF8C42')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#FFD98E')}
    >
      {product.images?.[0] && (
        <img
          src={product.images[0]}
          alt={product.name}
          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, color: '#2d1b00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </p>
        {product.brand && (
          <p style={{ margin: '0 0 3px', fontSize: '10px', color: '#9a7a5a' }}>{product.brand}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35' }}>
            ${displayPrice.toFixed(2)}
          </span>
          {wasPrice && (
            <span style={{ fontSize: '11px', color: '#aaa', textDecoration: 'line-through' }}>
              ${wasPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>→</span>
    </a>
  );
};

// ─── Birthday Banner ──────────────────────────────────────────────
const BirthdayBanner = ({ petName }: { petName?: string }) => (
  <div style={{
    background: 'linear-gradient(135deg, #fff8e1, #fff3cd)',
    border: '2px dashed #f59e0b',
    borderRadius: '12px', padding: '12px 14px',
    textAlign: 'center', margin: '4px 0',
  }}>
    <p style={{ margin: '0 0 4px', fontSize: '20px' }}>🎂🎉</p>
    <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
      Happy Birthday{petName ? `, ${petName}` : ''}!
    </p>
    <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#78350f' }}>
      Use code at checkout for a free birthday gift!
    </p>
    <div style={{
      background: '#fff', borderRadius: '8px', padding: '6px 14px',
      display: 'inline-block',
    }}>
      <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '3px', color: '#1a3c5e' }}>
        BDAYGIFT
      </span>
    </div>
  </div>
);

// ─── Pet Info Form ────────────────────────────────────────────────
const PetInfoForm = ({ onSubmit }: { onSubmit: (ctx: PetContext) => void }) => {
  const [petName, setPetName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: '8px',
    border: '1.5px solid #FFD98E', fontSize: '12px',
    background: '#FFF9F0', color: '#2d1b00', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#CC6A1A',
    display: 'block', marginBottom: '3px',
  };

  return (
    <div style={{
      background: '#FFF9F0', borderTop: '1px solid #FFE8C0',
      padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#9a7a5a', textAlign: 'center' }}>
        Tell us about your pet for personalized advice + birthday gifts! 🎁
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div>
          <label style={labelStyle}>Pet's name *</label>
          <input style={inputStyle} placeholder="e.g. Buddy" value={petName} onChange={e => setPetName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Pet's birthday *</label>
          <input style={inputStyle} type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Your name</label>
          <input style={inputStyle} placeholder="Optional" value={parentName} onChange={e => setParentName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Your email</label>
          <input style={inputStyle} type="email" placeholder="For birthday gift" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
        </div>
      </div>
      <button
        onClick={() => {
          if (petName && birthday) {
            onSubmit({ petName, birthday, parentName: parentName || undefined, parentEmail: parentEmail || undefined });
          }
        }}
        disabled={!petName || !birthday}
        style={{
          width: '100%', padding: '9px', borderRadius: '24px',
          background: petName && birthday ? '#FF8C42' : '#e2e8f0',
          color: petName && birthday ? '#fff' : '#9ca3af',
          border: 'none', cursor: petName && birthday ? 'pointer' : 'not-allowed',
          fontSize: '13px', fontWeight: 600, transition: 'background 0.2s',
        }}
      >
        Save & Start Chatting 🐾
      </button>
    </div>
  );
};

// ─── Main Widget ──────────────────────────────────────────────────
export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isWagging, setIsWagging] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    text: "Woof! Hi there! I'm Pawsy, PetShiwu's AI advisor! 🐾 I can help with nutrition, health, behavior, and finding the perfect products. What kind of pet do you have?",
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [petContext, setPetContext] = useState<PetContext>({});
  const [birthdayActive, setBirthdayActive] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) { setIsWagging(true); setTimeout(() => setIsWagging(false), 1000); }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, isMinimized]);

  const handlePetContextSave = (ctx: PetContext) => {
    setPetContext(ctx);
    setShowForm(false);
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: `Thanks! I've saved ${ctx.petName}'s info. ${ctx.parentEmail ? "We'll send a special birthday gift when the big day arrives! 🎂 " : ''}Now, how can I help you and ${ctx.petName} today? 🐾`,
    }]);
  };

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;

    setInput('');
    setSuggestedProducts([]);
    const newMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // ✅ Calls your backend — Gemini API key stays safe on the server
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ FIXED: send "text" not "content", exclude last user message from history
          messages: newMessages.slice(0, -1).map(m => ({ role: m.role, text: m.text })),
          userMessage: userText,
          petContext,
        }),
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const data = await response.json() as {
        success: boolean;
        data: {
          reply: string;
          products: Product[];
          birthdayCelebration: boolean;
          requireData: boolean;
        };
      };

      if (!data.success) throw new Error('API returned success: false');

      const { reply, products, birthdayCelebration } = data.data;

      setMessages([...newMessages, { role: 'assistant', text: reply }]);

      if (products?.length > 0) setSuggestedProducts(products);
      if (birthdayCelebration) setBirthdayActive(true);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages([...newMessages, {
        role: 'assistant',
        text: "Woof! Having a quick nap! Please try again in a moment. 🐾",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    { label: '🐶 Dog food', text: 'I need dog food recommendations' },
    { label: '🐱 Cat toys', text: 'What cat toys do you have?' },
    { label: '🐰 Rabbit supplies', text: 'I need supplies for my rabbit' },
    { label: '✨ Accessories', text: 'Show me pet accessories' },
  ];

  const hasPetContext = !!(petContext.petName && petContext.birthday);

  return (
    <>
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '20px', width: '360px',
          maxHeight: isMinimized ? '70px' : '580px',
          background: '#fff', borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 99999, transition: 'max-height 0.3s ease',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          border: '2px solid #FFD98E',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
            padding: '12px 16px', display: 'flex', alignItems: 'center',
            gap: '12px', cursor: 'pointer', flexShrink: 0,
          }} onClick={() => setIsMinimized(!isMinimized)}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              animation: isWagging ? 'headWag 0.3s ease 3' : 'none',
            }}>
              <DogFace size={38} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                Pawsy {hasPetContext && petContext.petName ? `· ${petContext.petName}'s Advisor` : ''}
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                PetShiwu AI Advisor
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Pet info toggle */}
              <button onClick={e => { e.stopPropagation(); setShowForm(f => !f); }} title="Edit pet info" style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🐾</button>
              <button onClick={e => { e.stopPropagation(); setIsMinimized(m => !m); }} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{isMinimized ? '▲' : '▼'}</button>
              <button onClick={e => { e.stopPropagation(); setIsOpen(false); }} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer',
                fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '12px',
                background: '#FFF9F0',
              }}>
                {/* Birthday banner */}
                {birthdayActive && <BirthdayBanner petName={petContext.petName} />}

                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '8px',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#fff', border: '2px solid #FFD98E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <DogAvatar size={26} />
                      </div>
                    )}
                    <div style={{
                      background: msg.role === 'user' ? '#FF8C42' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#2d1b00',
                      border: msg.role === 'assistant' ? '1.5px solid #FFD98E' : 'none',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      padding: '10px 14px', maxWidth: '78%',
                      fontSize: '13px', lineHeight: '1.6',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: '#fff', border: '2px solid #FFD98E',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <DogAvatar size={26} />
                    </div>
                    <div style={{
                      background: '#fff', border: '1.5px solid #FFD98E',
                      borderRadius: '4px 18px 18px 18px', padding: '12px 16px',
                      display: 'flex', gap: '5px', alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#FF8C42', opacity: 0.7,
                          animation: 'chatBounce 1.2s infinite',
                          animationDelay: `${i * 0.2}s`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Product recommendations */}
                {suggestedProducts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#9a7a5a', fontWeight: 600 }}>
                      🛍️ Recommended from PetShiwu:
                    </p>
                    {suggestedProducts.map(p => <ProductCard key={p._id} product={p} />)}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Pet info form */}
              {showForm && <PetInfoForm onSubmit={handlePetContextSave} />}

              {/* Quick replies */}
              {!showForm && messages.length <= 2 && (
                <div style={{
                  padding: '8px 12px', display: 'flex', gap: '6px',
                  flexWrap: 'wrap', background: '#fff', borderTop: '1px solid #FFE8C0',
                }}>
                  {quickReplies.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q.text)} style={{
                      fontSize: '12px', padding: '5px 12px', borderRadius: '20px',
                      border: '1.5px solid #FFD98E', background: '#FFF5E0',
                      color: '#CC6A1A', cursor: 'pointer', fontWeight: 500,
                    }}>{q.label}</button>
                  ))}
                </div>
              )}

              {/* Input */}
              {!showForm && (
                <div style={{
                  padding: '12px', display: 'flex', gap: '8px',
                  background: '#fff', borderTop: '1px solid #FFE8C0', flexShrink: 0,
                }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={hasPetContext ? `Ask about ${petContext.petName}...` : 'Ask Pawsy anything...'}
                    disabled={isLoading}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '24px',
                      border: '1.5px solid #FFD98E', fontSize: '13px',
                      outline: 'none', background: '#FFF9F0', color: '#2d1b00',
                    }}
                  />
                  <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: input.trim() ? '#FF8C42' : '#e2e8f0',
                    border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}>
                    <SendIcon color={input.trim() ? '#fff' : '#9ca3af'} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Dog Button (unchanged) */}
      <button
        onClick={() => { setIsOpen(o => !o); setIsMinimized(false); }}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#fff', border: '3px solid #FF8C42',
          cursor: 'pointer', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(255,140,66,0.5)',
          transition: 'transform 0.2s, box-shadow 0.2s', padding: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(255,140,66,0.6)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(255,140,66,0.5)';
        }}
        aria-label="Chat with Pawsy AI assistant"
      >
        {isOpen
          ? <span style={{ fontSize: '24px', color: '#FF8C42', fontWeight: 700, lineHeight: 1 }}>✕</span>
          : <DogFace size={52} />
        }
      </button>

      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes headWag {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  );
}
