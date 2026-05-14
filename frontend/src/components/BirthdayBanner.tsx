// FILE: frontend/src/components/BirthdayBanner.tsx

import { useEffect, useRef, useState } from 'react'

const DogSVG = () => (
  <svg width="150" height="190" viewBox="0 0 150 190" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'dogBob 2.2s ease-in-out infinite alternate', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}>
    <polygon points="75,18 58,62 92,62" fill="#FF6B9D" stroke="#fff" strokeWidth="1.5"/>
    <line x1="75" y1="18" x2="75" y2="10" stroke="#FDE68A" strokeWidth="2"/>
    <circle cx="75" cy="9" r="5" fill="#FDE68A"/>
    <line x1="61" y1="55" x2="57" y2="65" stroke="#A78BFA" strokeWidth="1.5"/>
    <line x1="68" y1="58" x2="65" y2="68" stroke="#34D399" strokeWidth="1.5"/>
    <line x1="82" y1="58" x2="85" y2="68" stroke="#60A5FA" strokeWidth="1.5"/>
    <ellipse cx="46" cy="88" rx="18" ry="26" fill="#C8841A" transform="rotate(-18 46 88)"/>
    <ellipse cx="104" cy="88" rx="18" ry="26" fill="#C8841A" transform="rotate(18 104 88)"/>
    <circle cx="75" cy="100" r="42" fill="#E8A030"/>
    <ellipse cx="75" cy="116" rx="20" ry="14" fill="#D4891C"/>
    <circle cx="60" cy="92" r="8" fill="#1a1a1a"/>
    <circle cx="90" cy="92" r="8" fill="#1a1a1a"/>
    <circle cx="62" cy="90" r="3" fill="white"/>
    <circle cx="92" cy="90" r="3" fill="white"/>
    <ellipse cx="75" cy="110" rx="8" ry="6" fill="#1a1a1a"/>
    <ellipse cx="73" cy="108" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.4)"/>
    <path d="M62 120 Q75 132 88 120" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="75" cy="128" rx="9" ry="7" fill="#E55050"/>
    <ellipse cx="75" cy="165" rx="32" ry="25" fill="#E8A030"/>
    <ellipse cx="52" cy="182" rx="12" ry="8" fill="#D4891C"/>
    <ellipse cx="98" cy="182" rx="12" ry="8" fill="#D4891C"/>
    <polygon points="63,142 72,148 63,154" fill="#FF6B9D"/>
    <polygon points="87,142 78,148 87,154" fill="#FF6B9D"/>
    <circle cx="75" cy="148" r="5" fill="#FF6B9D"/>
    <path d="M107 160 Q130 140 125 120" stroke="#C8841A" strokeWidth="10" fill="none" strokeLinecap="round"/>
  </svg>
)

const CatSVG = () => (
  <svg width="145" height="190" viewBox="0 0 145 190" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'catBob 2.6s ease-in-out infinite alternate', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}>
    <polygon points="72,16 55,58 89,58" fill="#60A5FA" stroke="#fff" strokeWidth="1.5"/>
    <line x1="72" y1="16" x2="72" y2="8" stroke="#FDE68A" strokeWidth="2"/>
    <circle cx="72" cy="7" r="5" fill="#FDE68A"/>
    <line x1="58" y1="51" x2="54" y2="61" stroke="#FF6B9D" strokeWidth="1.5"/>
    <line x1="65" y1="54" x2="62" y2="64" stroke="#34D399" strokeWidth="1.5"/>
    <line x1="79" y1="54" x2="82" y2="64" stroke="#A78BFA" strokeWidth="1.5"/>
    <polygon points="44,72 52,98 30,95" fill="#E8688A"/>
    <polygon points="46,76 52,95 34,93" fill="#F9A8B8"/>
    <polygon points="100,72 92,98 114,95" fill="#E8688A"/>
    <polygon points="98,76 92,95 110,93" fill="#F9A8B8"/>
    <circle cx="72" cy="105" r="40" fill="#F4A0B0"/>
    <ellipse cx="72" cy="118" rx="22" ry="14" fill="#fff"/>
    <ellipse cx="58" cy="98" rx="8" ry="9" fill="#1a1a1a"/>
    <ellipse cx="86" cy="98" rx="8" ry="9" fill="#1a1a1a"/>
    <ellipse cx="58" cy="98" rx="4" ry="7" fill="#2ecc71"/>
    <ellipse cx="86" cy="98" rx="4" ry="7" fill="#2ecc71"/>
    <ellipse cx="58" cy="98" rx="2" ry="6" fill="#1a1a1a"/>
    <ellipse cx="86" cy="98" rx="2" ry="6" fill="#1a1a1a"/>
    <circle cx="60" cy="95" r="2" fill="white"/>
    <circle cx="88" cy="95" r="2" fill="white"/>
    <polygon points="72,113 68,109 76,109" fill="#E8688A"/>
    <path d="M68 114 Q72 120 76 114" stroke="#c0506a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <line x1="30" y1="112" x2="58" y2="116" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
    <line x1="30" y1="118" x2="58" y2="118" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
    <line x1="86" y1="116" x2="114" y2="112" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
    <line x1="86" y1="118" x2="114" y2="118" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
    <ellipse cx="72" cy="165" rx="30" ry="24" fill="#F4A0B0"/>
    <ellipse cx="50" cy="182" rx="12" ry="8" fill="#E8688A"/>
    <ellipse cx="94" cy="182" rx="12" ry="8" fill="#E8688A"/>
    <path d="M42 160 Q18 140 22 115 Q26 95 38 100" stroke="#E8688A" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <polygon points="60,138 68,144 60,150" fill="#60A5FA"/>
    <polygon points="84,138 76,144 84,150" fill="#60A5FA"/>
    <circle cx="72" cy="144" r="5" fill="#60A5FA"/>
  </svg>
)

export default function BirthdayBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('petshiwu_profile_'))
    setVisible(!key)
  }, [])

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const COLS = ['#FFD700','#FF6B9D','#A78BFA','#34D399','#60A5FA','#F97316','#fff','#FCA5A5']
    const P: any[] = []
    for (let i = 0; i < 120; i++) P.push({ x: Math.random()*900, y: Math.random()*300-300, r: Math.random()*5+3, d: Math.random()*80+20, c: COLS[Math.floor(Math.random()*COLS.length)], t: 0, ti: Math.random()*.07+.05 })
    let ang = 0, raf: number
    const draw = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight
      ang += .01
      P.forEach(p => {
        p.t += p.ti; p.y += (Math.cos(ang+p.d)+2)*.55; p.x += Math.sin(ang)*.4
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random()*canvas.width }
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.c
        const tilt = Math.sin(p.t)*11
        ctx.moveTo(p.x+tilt+p.r/4, p.y); ctx.lineTo(p.x+tilt, p.y+tilt+p.r/4); ctx.stroke()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [visible])

  // ✅ Fires custom event — AIPetAdvisor listens and opens instantly
  function openChat() {
    window.dispatchEvent(new CustomEvent('openPetAdvisor'))
  }

  if (!visible) return null

  const F = "'Nunito',sans-serif"

  return (
    <div style={{ position:'relative', width:'100%', background:'linear-gradient(135deg,#3b0764 0%,#4c1d95 35%,#1e3a8a 70%,#1e40af 100%)', overflow:'hidden', padding:'44px 28px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'320px', fontFamily:F }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes dogBob{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-14px) rotate(2deg)}}
        @keyframes catBob{from{transform:translateY(0) rotate(2deg)}to{transform:translateY(-12px) rotate(-2deg)}}
      `}</style>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:.65 }} />
      <div style={{ position:'absolute', top:-60, left:-60, width:280, height:280, background:'radial-gradient(circle,rgba(167,139,250,0.28) 0%,transparent 70%)', borderRadius:'50%' }} />
      <div style={{ position:'absolute', bottom:-40, right:'8%', width:220, height:220, background:'radial-gradient(circle,rgba(96,165,250,0.22) 0%,transparent 70%)', borderRadius:'50%' }} />

      <div style={{ position:'relative', zIndex:2, maxWidth:1100, width:'100%', display:'flex', alignItems:'center', flexWrap:'wrap', justifyContent:'center' }}>
        <div style={{ flexShrink:0, marginRight:-10, zIndex:3 }}><DogSVG /></div>

        <div style={{ flex:'1 1 0', minWidth:0, display:'flex', alignItems:'center', gap:36, flexWrap:'wrap', justifyContent:'center', padding:'0 8px' }}>
          <div style={{ flex:'1 1 300px', minWidth:260 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.13)', border:'1px solid rgba(255,255,255,0.22)', borderRadius:100, padding:'6px 16px', fontSize:13, fontWeight:700, color:'#FDE68A', marginBottom:18 }}>🎂 Pet Birthday Rewards</div>
            <h2 style={{ margin:'0 0 14px', fontSize:'clamp(24px,3.5vw,42px)', fontWeight:900, lineHeight:1.1, color:'#fff' }}>
              Celebrate Your<br />
              <span style={{ background:'linear-gradient(90deg,#FDE68A,#FCA5A5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Pet's Birthday!</span>
            </h2>
            <p style={{ margin:'0 0 22px', fontSize:14.5, lineHeight:1.7, color:'rgba(255,255,255,.82)', maxWidth:360 }}>
              Tell our AI your pet's birthday and receive an exclusive <strong style={{ color:'#FDE68A' }}>20% OFF coupon</strong> + a <strong style={{ color:'#FDE68A' }}>FREE birthday gift</strong> delivered right on their special day!
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:26 }}>
              {[['🎁','Free birthday gift with your order'],['💸','20% OFF — code BDAYGIFT auto-unlocked'],['🚚','Free shipping on birthday orders']].map(([icon,text]) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(255,255,255,.88)', fontWeight:600 }}>
                  <span style={{ fontSize:17, width:24, textAlign:'center' }}>{icon}</span>{text}
                </div>
              ))}
            </div>
            <button onClick={openChat} style={{ display:'inline-flex', alignItems:'center', gap:9, background:'#16a34a', color:'#fff', border:'none', borderRadius:100, padding:'15px 28px', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:F, boxShadow:'0 4px 20px rgba(22,163,74,.45)' }}>
              🐾 Tell AI Your Pet's Birthday
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <p style={{ marginTop:11, fontSize:11.5, color:'rgba(255,255,255,.45)' }}>✓ Takes 10 seconds &nbsp;·&nbsp; ✓ Discount unlocked automatically</p>
          </div>

          <div style={{ flexShrink:0, width:276 }}>
            <div style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.16)', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,.38)' }}>
              <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)', padding:'12px 14px', display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#F97316', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>🐾</div>
                <div>
                  <div style={{ color:'#fff', fontWeight:800, fontSize:13, fontFamily:F }}>AI Pet Advisor</div>
                  <div style={{ color:'rgba(255,255,255,.6)', fontSize:10.5, display:'flex', alignItems:'center', gap:4, fontFamily:F }}>
                    <span style={{ width:6, height:6, background:'#34d399', borderRadius:'50%', display:'inline-block' }} /> Online now
                  </div>
                </div>
              </div>
              <div style={{ padding:12, display:'flex', flexDirection:'column', gap:9, background:'#f8f9fc' }}>
                {[
                  { side:'bot', text:"What is your pet's birthday? 🎂" },
                  { side:'usr', text:'📅 June 15' },
                  { side:'cel', text:"🎉 We'll send a birthday gift & 20% OFF coupon on June 15th!" },
                ].map((m,i) => (
                  <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-end', flexDirection: m.side==='usr' ? 'row-reverse' : 'row' }}>
                    {m.side!=='usr' && <div style={{ width:23, height:23, borderRadius:'50%', background:'#1e3a8a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0 }}>🐾</div>}
                    <div style={{ maxWidth:178, padding:'8px 11px', borderRadius:13, fontSize:12, lineHeight:1.5, fontWeight:600, fontFamily:F, ...(m.side==='bot'?{background:'#fff',border:'1px solid #e5e7eb',color:'#111827',borderBottomLeftRadius:4}:m.side==='usr'?{background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',borderBottomRightRadius:4}:{background:'linear-gradient(135deg,#fef3c7,#fde68a)',border:'1px solid #fbbf24',color:'#92400e',borderBottomLeftRadius:4}) }}>{m.text}</div>
                  </div>
                ))}
                <div style={{ background:'linear-gradient(135deg,#16a34a,#15803d)', padding:'8px 12px', display:'flex', alignItems:'center', gap:7, borderRadius:9, marginTop:2 }}>
                  <span style={{ fontSize:17 }}>🎁</span>
                  <div><div style={{ color:'#fff', fontSize:11, fontWeight:800, fontFamily:F }}>Special birthday discount</div><div style={{ color:'rgba(255,255,255,.8)', fontSize:10, fontWeight:600, fontFamily:F }}>unlocked automatically on the day!</div></div>
                </div>
              </div>
              <div style={{ background:'#1e3a8a', padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontSize:11, color:'rgba(255,255,255,.9)', fontWeight:700, fontFamily:F }}>🚚 Free Shipping on Birthday Orders ❤️</div>
            </div>
          </div>
        </div>

        <div style={{ flexShrink:0, marginLeft:-10, zIndex:3 }}><CatSVG /></div>
      </div>
    </div>
  )
}
