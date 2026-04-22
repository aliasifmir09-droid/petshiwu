import AIChatWidget from './components/AIChatWidget';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are PetShiwu's friendly AI product finder assistant named "Pawsy". PetShiwu is a premium US pet e-commerce store at petshiwu.com selling food, toys, accessories and supplies for dogs, cats, rabbits, birds, fish and other pets.

Your job is to help customers find the right products. Keep responses short (2-4 sentences), warm and helpful. Suggest specific product types with brief reasons. Always end with a follow-up question to help narrow down what they need.

When suggesting products, mention you can help them search on the site. Never make up specific product names or prices.`;

// Cute dog SVG face
const DogFace = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head */}
    <circle cx="40" cy="42" r="28" fill="#F5A623"/>
    {/* Left ear */}
    <ellipse cx="18" cy="22" rx="10" ry="14" fill="#E8941A" transform="rotate(-15 18 22)"/>
    {/* Right ear */}
    <ellipse cx="62" cy="22" rx="10" ry="14" fill="#E8941A" transform="rotate(15 62 22)"/>
    {/* Inner left ear */}
    <ellipse cx="18" cy="23" rx="6" ry="9" fill="#F5C16C" transform="rotate(-15 18 23)"/>
    {/* Inner right ear */}
    <ellipse cx="62" cy="23" rx="6" ry="9" fill="#F5C16C" transform="rotate(15 62 23)"/>
    {/* Face patch */}
    <ellipse cx="40" cy="50" rx="18" ry="14" fill="#F5C16C"/>
    {/* Left eye */}
    <circle cx="30" cy="36" r="6" fill="white"/>
    <circle cx="31" cy="36" r="3.5" fill="#2C1810"/>
    <circle cx="32" cy="34.5" r="1.2" fill="white"/>
    {/* Right eye */}
    <circle cx="50" cy="36" r="6" fill="white"/>
    <circle cx="51" cy="36" r="3.5" fill="#2C1810"/>
    <circle cx="52" cy="34.5" r="1.2" fill="white"/>
    {/* Nose */}
    <ellipse cx="40" cy="47" rx="5" ry="3.5" fill="#2C1810"/>
    {/* Nostrils */}
    <circle cx="38" cy="47.5" r="1" fill="#1a0e0a"/>
    <circle cx="42" cy="47.5" r="1" fill="#1a0e0a"/>
    {/* Mouth */}
    <path d="M36 52 Q40 56 44 52" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Tongue */}
    <ellipse cx="40" cy="55" rx="4" ry="3" fill="#FF6B8A"/>
    {/* Cheek blush left */}
    <ellipse cx="22" cy="46" rx="5" ry="3" fill="#FFB3C1" opacity="0.6"/>
    {/* Cheek blush right */}
    <ellipse cx="58" cy="46" rx="5" ry="3" fill="#FFB3C1" opacity="0.6"/>
  </svg>
);

// Small dog face for message avatar
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

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Woof! Hi there! I'm Pawsy, PetShiwu's AI assistant! I can help you find the perfect products for your furry friend! What kind of pet do you have? 🐾"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isWagging, setIsWagging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wag animation on open
  useEffect(() => {
    if (isOpen) {
      setIsWagging(true);
      setTimeout(() => setIsWagging(false), 1000);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Woof! I'd love to help! Could you tell me more about your pet?";
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "Woof! I'm having a quick nap! Please try again in a moment. 🐾" }]);
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

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '20px', width: '360px',
          maxHeight: isMinimized ? '70px' : '540px',
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

            {/* Dog avatar in header */}
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
              <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px' }}>Pawsy</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                PetShiwu AI Assistant
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: '#fff', width: '28px', height: '28px', borderRadius: '50%',
                cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{isMinimized ? '▲' : '▼'}</button>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: '#fff', width: '28px', height: '28px', borderRadius: '50%',
                cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
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
                      {msg.content}
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
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              {messages.length <= 2 && (
                <div style={{
                  padding: '8px 12px', display: 'flex', gap: '6px',
                  flexWrap: 'wrap', background: '#fff',
                  borderTop: '1px solid #FFE8C0',
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
              <div style={{
                padding: '12px', display: 'flex', gap: '8px',
                background: '#fff', borderTop: '1px solid #FFE8C0', flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask Pawsy anything..."
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
            </>
          )}
        </div>
      )}

      {/* Floating Dog Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#fff',
          border: '3px solid #FF8C42',
          cursor: 'pointer', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(255,140,66,0.5)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          padding: 0,
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
}<AIChatWidget />
