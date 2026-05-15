import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { slideshowService } from '@/services/slideshow';
import LoadingSpinner from './LoadingSpinner';
import { Helmet } from 'react-helmet-async';
import { normalizeImageUrl, generateSrcSet } from '@/utils/imageUtils';

interface Slide {
  _id: string;
  id?: string;
  title: string;
  imageUrl: string;
  leftImage?: string;
  link: string;
  // ✅ added 'nycDelivery'
  type?: 'default' | 'birthdayBanner' | 'nycDelivery';
}

// ─── Dog SVG ──────────────────────────────────────────────────────
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
);

// ─── Cat SVG ──────────────────────────────────────────────────────
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
);

// ─── Open AI chat ─────────────────────────────────────────────────
function openChat(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  window.dispatchEvent(new CustomEvent('openPetAdvisor'));
}

// ─── Main Component ───────────────────────────────────────────────
const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showBirthdayBanner, setShowBirthdayBanner] = useState(false);

  useEffect(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('petshiwu_profile_'));
    setShowBirthdayBanner(!key);
  }, []);

  const { data: fetchedSlides = [], isLoading } = useQuery<Slide[]>({
    queryKey: ['slideshow', 'active'],
    queryFn: slideshowService.getActiveSlides,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 100,
  });

  // ✅ NYC slide always shows as second slide
  const nycSlide: Slide = {
    _id: 'nyc-delivery',
    type: 'nycDelivery',
    title: 'NYC Fastest Pet Delivery',
    link: '/products',
    imageUrl: '',
  };

  const slides: Slide[] = [
    ...(showBirthdayBanner ? [{ _id: 'birthday-banner', type: 'birthdayBanner' as const, title: "Celebrate Your Pet's Birthday!", link: '#', imageUrl: '' }] : []),
    nycSlide,
    ...fetchedSlides,
  ];

  // Preload hero images (skip custom slides)
  useEffect(() => {
    if (slides.length === 0) return;
    const imagesToPreload = slides
      .filter(s => s.type !== 'birthdayBanner' && s.type !== 'nycDelivery')
      .slice(0, 2)
      .map(s => normalizeImageUrl(s.leftImage || s.imageUrl, { width: 1920, height: 720, format: 'auto' }));
    imagesToPreload.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload'; link.as = 'image'; link.href = src;
      document.head.appendChild(link);
      new Image().src = src;
    });
  }, [slides.length]);

  const firstSlideImage = slides.length > 0 && slides[0].type !== 'birthdayBanner' && slides[0].type !== 'nycDelivery'
    ? normalizeImageUrl(slides[0].leftImage || slides[0].imageUrl, { width: 1920, height: 720, format: 'auto' })
    : null;

  // Auto-advance
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Confetti canvas for birthday banner
  useEffect(() => {
    const isBirthdaySlide = slides[currentSlide]?.type === 'birthdayBanner';
    if (!isBirthdaySlide) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const COLS = ['#FFD700','#FF6B9D','#A78BFA','#34D399','#60A5FA','#F97316','#fff','#FCA5A5'];
    const P: any[] = [];
    for (let i = 0; i < 120; i++) P.push({ x: Math.random()*900, y: Math.random()*300-300, r: Math.random()*5+3, d: Math.random()*80+20, c: COLS[Math.floor(Math.random()*COLS.length)], t: 0, ti: Math.random()*.07+.05 });
    let ang = 0, raf: number;
    const draw = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      ang += .01;
      P.forEach(p => {
        p.t += p.ti; p.y += (Math.cos(ang + p.d) + 2) * .55; p.x += Math.sin(ang) * .4;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.c;
        const tilt = Math.sin(p.t) * 11;
        ctx.moveTo(p.x + tilt + p.r / 4, p.y); ctx.lineTo(p.x + tilt, p.y + tilt + p.r / 4); ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [currentSlide, slides]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (i: number) => setCurrentSlide(i);

  if (isLoading) {
    return (
      <div className="w-full mt-4">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <div className="relative w-full overflow-hidden bg-gray-100 rounded-xl shadow-lg aspect-[16/6] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  const F = "'Nunito',sans-serif";

  return (
    <>
      {firstSlideImage && (
        <Helmet>
          <link rel="preload" as="image" href={firstSlideImage} fetchPriority="high" />
        </Helmet>
      )}

      <div className="w-full mt-4">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-4">
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
            <div className="relative w-full aspect-[16/6]" style={{ contain: 'layout style paint' }}>

              {slides.map((slide, index) => {

                // ── Birthday Banner Slide ──────────────────────────
                if (slide.type === 'birthdayBanner') {
                  return (
                    <div
                      key={slide._id}
                      className={`absolute inset-0 transition-all duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                      style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(135deg,#3b0764 0%,#4c1d95 35%,#1e3a8a 70%,#1e40af 100%)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}
                    >
                      <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
                        @keyframes dogBob{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-14px) rotate(2deg)}}
                        @keyframes catBob{from{transform:translateY(0) rotate(2deg)}to{transform:translateY(-12px) rotate(-2deg)}}
                      `}</style>
                      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: .65 }} />
                      <div style={{ position: 'absolute', top: -60, left: -60, width: 280, height: 280, background: 'radial-gradient(circle,rgba(167,139,250,0.28) 0%,transparent 70%)', borderRadius: '50%' }} />
                      <div style={{ position: 'absolute', bottom: -40, right: '8%', width: 220, height: 220, background: 'radial-gradient(circle,rgba(96,165,250,0.22) 0%,transparent 70%)', borderRadius: '50%' }} />
                      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, width: '100%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', padding: '0 28px' }}>
                        <div style={{ flexShrink: 0, marginRight: -10, zIndex: 3 }}><DogSVG /></div>
                        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap', justifyContent: 'center', padding: '0 8px' }}>
                          <div style={{ flex: '1 1 300px', minWidth: 260 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#FDE68A', marginBottom: 18 }}>🎂 Pet Birthday Rewards</div>
                            <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(20px,3vw,38px)', fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>
                              Celebrate Your<br />
                              <span style={{ background: 'linear-gradient(90deg,#FDE68A,#FCA5A5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pet's Birthday!</span>
                            </h2>
                            <p style={{ margin: '0 0 18px', fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,.82)', maxWidth: 340 }}>
                              Tell our AI your pet's birthday and receive an exclusive <strong style={{ color: '#FDE68A' }}>20% OFF coupon</strong> + a <strong style={{ color: '#FDE68A' }}>FREE birthday gift</strong> on their special day!
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
                              {[['🎁', 'Free birthday gift with your order'], ['💸', '20% OFF — code BDAYGIFT auto-unlocked'], ['🚚', 'Free shipping on birthday orders']].map(([icon, text]) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'rgba(255,255,255,.88)', fontWeight: 600 }}>
                                  <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{icon}</span>{text}
                                </div>
                              ))}
                            </div>
                            <button onClick={openChat} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 100, padding: '13px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 20px rgba(22,163,74,.45)' }}>
                              🐾 Tell AI Your Pet's Birthday
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                            </button>
                            <p style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.4)' }}>✓ Takes 10 seconds &nbsp;·&nbsp; ✓ Discount unlocked automatically</p>
                          </div>
                          <div style={{ flexShrink: 0, width: 260 }}>
                            <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.38)' }}>
                              <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🐾</div>
                                <div>
                                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 12.5, fontFamily: F }}>AI Pet Advisor</div>
                                  <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, fontFamily: F }}>
                                    <span style={{ width: 5, height: 5, background: '#34d399', borderRadius: '50%', display: 'inline-block' }} /> Online now
                                  </div>
                                </div>
                              </div>
                              <div style={{ padding: 11, display: 'flex', flexDirection: 'column', gap: 8, background: '#f8f9fc' }}>
                                {[{ side: 'bot', text: "What is your pet's birthday? 🎂" }, { side: 'usr', text: '📅 June 15' }, { side: 'cel', text: "🎉 Birthday gift & 20% OFF coupon on June 15th!" }].map((m, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexDirection: m.side === 'usr' ? 'row-reverse' : 'row' }}>
                                    {m.side !== 'usr' && <div style={{ width: 21, height: 21, borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>🐾</div>}
                                    <div style={{ maxWidth: 165, padding: '7px 10px', borderRadius: 12, fontSize: 11.5, lineHeight: 1.5, fontWeight: 600, fontFamily: F, ...(m.side === 'bot' ? { background: '#fff', border: '1px solid #e5e7eb', color: '#111827', borderBottomLeftRadius: 3 } : m.side === 'usr' ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', borderBottomRightRadius: 3 } : { background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1px solid #fbbf24', color: '#92400e', borderBottomLeftRadius: 3 }) }}>{m.text}</div>
                                  </div>
                                ))}
                                <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '7px 11px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, marginTop: 1 }}>
                                  <span style={{ fontSize: 15 }}>🎁</span>
                                  <div>
                                    <div style={{ color: '#fff', fontSize: 10.5, fontWeight: 800, fontFamily: F }}>Special birthday discount</div>
                                    <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 9.5, fontWeight: 600, fontFamily: F }}>unlocked automatically on the day!</div>
                                  </div>
                                </div>
                              </div>
                              <div style={{ background: '#1e3a8a', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10.5, color: 'rgba(255,255,255,.9)', fontWeight: 700, fontFamily: F }}>🚚 Free Shipping on Birthday Orders ❤️</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, marginLeft: -10, zIndex: 3 }}><CatSVG /></div>
                      </div>
                    </div>
                  );
                }

                // ── NYC Delivery Slide ─────────────────────────────
                if (slide.type === 'nycDelivery') {
                  return (
                    <Link
                      key={slide._id}
                      to="/products"
                      className={`absolute inset-0 transition-all duration-1000 block ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                      style={{ background: 'linear-gradient(180deg,#0c1445 0%,#1a237e 40%,#283593 70%,#1565c0 100%)', overflow: 'hidden', display: 'flex', alignItems: 'center', fontFamily: F }}
                    >
                      <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
                        @keyframes nycTwinkle{0%,100%{opacity:0.8}50%{opacity:0.2}}
                        @keyframes nycDogBob{from{transform:translateY(0)}to{transform:translateY(-10px)}}
                        @keyframes nycCatBob{from{transform:translateY(0)}to{transform:translateY(-8px)}}
                        @keyframes nycRabbitBob{from{transform:translateY(0)}to{transform:translateY(-12px)}}
                        @keyframes nycStreak{from{transform:translateX(-200px);opacity:0}30%{opacity:1}to{transform:translateX(200vw);opacity:0}}
                        @keyframes nycVanSlide{from{transform:translateX(120px);opacity:0}to{transform:translateX(0);opacity:1}}
                      `}</style>

                      {/* Stars + Moon */}
                      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} viewBox="0 0 900 360">
                        {[{cx:50,cy:30},{cx:120,cy:15},{cx:200,cy:40},{cx:300,cy:20},{cx:420,cy:35},{cx:520,cy:12},{cx:650,cy:28},{cx:780,cy:18},{cx:860,cy:42},{cx:80,cy:60},{cx:380,cy:55},{cx:700,cy:50}].map((s,i)=>(
                          <circle key={i} cx={s.cx} cy={s.cy} r="1.2" fill="white" opacity="0.6" style={{ animation:`nycTwinkle ${2.5+i*0.25}s infinite ${i*0.28}s` }}/>
                        ))}
                        <circle cx="820" cy="38" r="18" fill="#FEF3C7" opacity="0.9"/>
                        <circle cx="830" cy="32" r="14" fill="#1a237e" opacity="0.95"/>
                      </svg>

                      {/* Speed streaks */}
                      {[{top:'30%',w:160,c:'rgba(252,211,77,0.5)',d:'1.9s',dl:'0s'},{top:'50%',w:110,c:'rgba(255,255,255,0.25)',d:'2.3s',dl:'0.6s'},{top:'66%',w:190,c:'rgba(252,211,77,0.35)',d:'1.7s',dl:'1.1s'}].map((s,i)=>(
                        <div key={i} style={{ position:'absolute', top:s.top, height:2, width:s.w, borderRadius:2, background:`linear-gradient(90deg,transparent,${s.c},transparent)`, animation:`nycStreak ${s.d} linear infinite`, animationDelay:s.dl }} />
                      ))}

                      {/* NYC Skyline SVG */}
                      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'75%' }} viewBox="0 0 900 280" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
                        <rect x="0" y="160" width="60" height="120" fill="#0d1b4b"/>
                        <rect x="55" y="140" width="40" height="140" fill="#0d1b4b"/>
                        <rect x="760" y="155" width="50" height="125" fill="#0d1b4b"/>
                        <rect x="845" y="165" width="55" height="115" fill="#0d1b4b"/>
                        <rect x="10" y="130" width="45" height="150" fill="#152060"/>
                        {[{x:16,y:138},{x:26,y:138},{x:36,y:138},{x:16,y:148},{x:36,y:148},{x:26,y:158},{x:16,y:168},{x:36,y:168}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="6" height="5" fill="#FEF3C7" opacity="0.5"/>)}
                        <rect x="58" y="105" width="38" height="175" fill="#172268"/>
                        {[{x:64,y:113},{x:73,y:113},{x:82,y:113},{x:64,y:122},{x:82,y:122},{x:73,y:131},{x:64,y:140},{x:82,y:140},{x:64,y:149},{x:73,y:149}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="5" height="4" fill="#FEF3C7" opacity="0.5"/>)}
                        {/* Empire State */}
                        <rect x="98" y="180" width="70" height="100" fill="#1a2a7a"/>
                        <rect x="108" y="140" width="50" height="45" fill="#1e3090"/>
                        <rect x="118" y="100" width="30" height="45" fill="#22368a"/>
                        <rect x="126" y="70" width="14" height="35" fill="#2640a0"/>
                        <rect x="131" y="35" width="4" height="38" fill="#3050c0"/>
                        <circle cx="133" cy="33" r="3" fill="#FCD34D" opacity="0.9" style={{ animation:'nycTwinkle 1.5s infinite' }}/>
                        {[{x:104,y:188},{x:114,y:188},{x:124,y:188},{x:134,y:188},{x:144,y:188},{x:104,y:198},{x:124,y:198},{x:144,y:198},{x:114,y:208},{x:134,y:208}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="5" height="4" fill={i%2===0?"#93c5fd":"#FEF3C7"} opacity="0.6"/>)}
                        <rect x="170" y="150" width="80" height="130" fill="#172268"/>
                        {[{x:176,y:158},{x:188,y:158},{x:200,y:158},{x:212,y:158},{x:224,y:158},{x:176,y:168},{x:200,y:168},{x:224,y:168},{x:188,y:178},{x:212,y:178},{x:176,y:188},{x:200,y:188}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="6" height="5" fill={i%3===0?"#93c5fd":"#FEF3C7"} opacity="0.5"/>)}
                        {/* Chrysler */}
                        <rect x="252" y="155" width="55" height="125" fill="#1a2a7a"/>
                        <rect x="260" y="120" width="39" height="40" fill="#1e3090"/>
                        <rect x="267" y="90" width="25" height="35" fill="#22368a"/>
                        <path d="M267,90 L279,60 L291,90 Z" fill="#2a40a8"/>
                        <path d="M271,88 L279,68 L287,88 Z" fill="#3050c0"/>
                        <rect x="278" y="48" width="3" height="18" fill="#3050c0"/>
                        <circle cx="279" cy="46" r="2.5" fill="#FCD34D" opacity="0.9" style={{ animation:'nycTwinkle 2s infinite 0.5s' }}/>
                        {[{x:258,y:162},{x:268,y:162},{x:278,y:162},{x:288,y:162},{x:258,y:172},{x:278,y:172},{x:268,y:182},{x:288,y:182}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="5" height="4" fill={i%2===0?"#FEF3C7":"#93c5fd"} opacity="0.6"/>)}
                        <rect x="720" y="125" width="55" height="155" fill="#172268"/>
                        {[{x:726,y:133},{x:738,y:133},{x:750,y:133},{x:762,y:133},{x:726,y:143},{x:750,y:143},{x:726,y:153},{x:762,y:153},{x:738,y:163},{x:750,y:163}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="6" height="5" fill={i%2===0?"#FEF3C7":"#93c5fd"} opacity="0.5"/>)}
                        <rect x="778" y="105" width="48" height="175" fill="#1a2a7a"/>
                        {[{x:784,y:113},{x:794,y:113},{x:804,y:113},{x:814,y:113},{x:784,y:123},{x:804,y:123},{x:784,y:133},{x:814,y:133},{x:794,y:143},{x:804,y:143},{x:784,y:153},{x:814,y:153}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="5" height="4" fill={i%2===0?"#FEF3C7":"#93c5fd"} opacity="0.55"/>)}
                        <rect x="830" y="140" width="42" height="140" fill="#152060"/>
                        {[{x:836,y:148},{x:845,y:148},{x:855,y:148},{x:836,y:158},{x:855,y:158},{x:845,y:168}].map((w,i)=><rect key={i} x={w.x} y={w.y} width="5" height="4" fill="#FEF3C7" opacity="0.5"/>)}
                        {/* Road */}
                        <rect x="0" y="255" width="900" height="25" fill="#0a0f2e"/>
                        {[50,130,210,620,700,780].map((x,i)=><rect key={i} x={x} y="263" width="40" height="4" rx="2" fill="#FCD34D" opacity="0.55"/>)}
                        <rect x="0" y="248" width="900" height="8" fill="#131d5e"/>
                      </svg>

                      {/* Delivery Van */}
                      <div style={{ position:'absolute', bottom:22, right:255, animation:'nycVanSlide 1.2s ease-out 0.4s both' }}>
                        <svg width="145" height="68" viewBox="0 0 145 68" xmlns="http://www.w3.org/2000/svg">
                          <rect x="8" y="6" width="110" height="46" rx="5" fill="#1d4ed8"/>
                          <path d="M100,6 L100,38 L136,38 L130,6 Z" fill="#1e40af"/>
                          <rect x="105" y="12" width="20" height="18" rx="2" fill="#93c5fd" opacity="0.9"/>
                          <rect x="14" y="14" width="78" height="22" rx="2" fill="rgba(255,255,255,0.1)"/>
                          <text x="53" y="29" textAnchor="middle" fill="#FCD34D" fontSize="9" fontWeight="900" fontFamily="Nunito,sans-serif">🐾 PETSHIWU</text>
                          <rect x="8" y="50" width="110" height="5" fill="#FCD34D" opacity="0.8"/>
                          <circle cx="35" cy="58" r="10" fill="#0f172a"/>
                          <circle cx="35" cy="58" r="6" fill="#334155"/>
                          <circle cx="35" cy="58" r="2.5" fill="#FCD34D"/>
                          <circle cx="105" cy="58" r="10" fill="#0f172a"/>
                          <circle cx="105" cy="58" r="6" fill="#334155"/>
                          <circle cx="105" cy="58" r="2.5" fill="#FCD34D"/>
                          <rect x="134" y="22" width="9" height="7" rx="1.5" fill="#FCD34D"/>
                        </svg>
                      </div>

                      {/* Dog */}
                      <div style={{ position:'absolute', bottom:58, left:320, animation:'nycDogBob 2s ease-in-out infinite alternate' }}>
                        <svg width="88" height="112" viewBox="0 0 95 120" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="22" cy="42" rx="12" ry="18" fill="#C8841A" transform="rotate(-16 22 42)"/>
                          <ellipse cx="70" cy="42" rx="12" ry="18" fill="#C8841A" transform="rotate(16 70 42)"/>
                          <circle cx="46" cy="52" r="28" fill="#E8A030"/>
                          <ellipse cx="46" cy="64" rx="14" ry="9" fill="#D4891C"/>
                          <circle cx="34" cy="44" r="6" fill="#1a1a1a"/>
                          <circle cx="58" cy="44" r="6" fill="#1a1a1a"/>
                          <circle cx="35.5" cy="42.5" r="2" fill="white"/>
                          <circle cx="59.5" cy="42.5" r="2" fill="white"/>
                          <ellipse cx="46" cy="59" rx="5" ry="4" fill="#1a1a1a"/>
                          <path d="M39 66 Q46 73 53 66" stroke="#1a1a1a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                          <ellipse cx="46" cy="71" rx="6" ry="5" fill="#E55050"/>
                          <ellipse cx="46" cy="100" rx="22" ry="17" fill="#E8A030"/>
                          <ellipse cx="30" cy="115" rx="9" ry="6" fill="#D4891C"/>
                          <ellipse cx="62" cy="115" rx="9" ry="6" fill="#D4891C"/>
                          <path d="M68 98 Q82 88 79 72" stroke="#C8841A" strokeWidth="7" fill="none" strokeLinecap="round"/>
                          <polygon points="46,8 36,36 56,36" fill="#FF6B9D" stroke="#fff" strokeWidth="1"/>
                          <line x1="46" y1="8" x2="46" y2="3" stroke="#FDE68A" strokeWidth="1.5"/>
                          <circle cx="46" cy="2" r="3" fill="#FDE68A"/>
                        </svg>
                      </div>

                      {/* Cat */}
                      <div style={{ position:'absolute', bottom:53, left:424, animation:'nycCatBob 2.4s ease-in-out infinite alternate' }}>
                        <svg width="82" height="108" viewBox="0 0 88 115" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="22,30 28,54 12,52" fill="#E8688A"/>
                          <polygon points="24,34 28,52 16,50" fill="#F9A8B8"/>
                          <polygon points="62,30 56,54 72,52" fill="#E8688A"/>
                          <polygon points="60,34 56,52 68,50" fill="#F9A8B8"/>
                          <circle cx="44" cy="58" r="28" fill="#F4A0B0"/>
                          <ellipse cx="44" cy="68" rx="15" ry="10" fill="#fff"/>
                          <ellipse cx="33" cy="52" rx="6" ry="7" fill="#1a1a1a"/>
                          <ellipse cx="55" cy="52" rx="6" ry="7" fill="#1a1a1a"/>
                          <ellipse cx="33" cy="52" rx="3" ry="6" fill="#2ecc71"/>
                          <ellipse cx="55" cy="52" rx="3" ry="6" fill="#2ecc71"/>
                          <ellipse cx="33" cy="52" rx="1.5" ry="5" fill="#1a1a1a"/>
                          <ellipse cx="55" cy="52" rx="1.5" ry="5" fill="#1a1a1a"/>
                          <circle cx="34.5" cy="50" r="1.5" fill="white"/>
                          <circle cx="56.5" cy="50" r="1.5" fill="white"/>
                          <polygon points="44,65 40,61 48,61" fill="#E8688A"/>
                          <path d="M40,67 Q44,72 48,67" stroke="#c0506a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                          <line x1="16" y1="64" x2="36" y2="67" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
                          <line x1="16" y1="69" x2="36" y2="69" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
                          <line x1="52" y1="67" x2="72" y2="64" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
                          <line x1="52" y1="69" x2="72" y2="69" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9"/>
                          <ellipse cx="44" cy="97" rx="20" ry="16" fill="#F4A0B0"/>
                          <ellipse cx="28" cy="110" rx="9" ry="6" fill="#E8688A"/>
                          <ellipse cx="60" cy="110" rx="9" ry="6" fill="#E8688A"/>
                          <path d="M24 94 Q10 82 14 66 Q18 56 26 60" stroke="#E8688A" strokeWidth="6" fill="none" strokeLinecap="round"/>
                          <polygon points="44,8 34,32 54,32" fill="#60A5FA" stroke="#fff" strokeWidth="1"/>
                          <line x1="44" y1="8" x2="44" y2="3" stroke="#FDE68A" strokeWidth="1.5"/>
                          <circle cx="44" cy="2" r="3" fill="#FDE68A"/>
                        </svg>
                      </div>

                      {/* Rabbit */}
                      <div style={{ position:'absolute', bottom:56, left:522, animation:'nycRabbitBob 1.8s ease-in-out infinite alternate' }}>
                        <svg width="66" height="96" viewBox="0 0 72 105" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="24" cy="22" rx="7" ry="22" fill="#e8d5d5"/>
                          <ellipse cx="24" cy="22" rx="4" ry="18" fill="#f9a8c9"/>
                          <ellipse cx="48" cy="22" rx="7" ry="22" fill="#e8d5d5"/>
                          <ellipse cx="48" cy="22" rx="4" ry="18" fill="#f9a8c9"/>
                          <circle cx="36" cy="52" r="22" fill="#f0e6e6"/>
                          <circle cx="27" cy="47" r="4" fill="#1a1a1a"/>
                          <circle cx="45" cy="47" r="4" fill="#1a1a1a"/>
                          <circle cx="28.5" cy="45.5" r="1.5" fill="white"/>
                          <circle cx="46.5" cy="45.5" r="1.5" fill="white"/>
                          <ellipse cx="36" cy="56" rx="3" ry="2" fill="#f9a8c9"/>
                          <path d="M33 58 Q36 62 39 58" stroke="#c0506a" strokeWidth="1" fill="none" strokeLinecap="round"/>
                          <ellipse cx="36" cy="85" rx="18" ry="18" fill="#f0e6e6"/>
                          <ellipse cx="22" cy="98" rx="8" ry="5" fill="#e0d0d0"/>
                          <ellipse cx="50" cy="98" rx="8" ry="5" fill="#e0d0d0"/>
                          <circle cx="54" cy="82" r="7" fill="#fff"/>
                        </svg>
                      </div>

                      {/* Text content */}
                      <div style={{ position:'relative', zIndex:10, padding:'0 48px', maxWidth:360 }}>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(252,211,77,0.18)', border:'1px solid rgba(252,211,77,0.45)', borderRadius:100, padding:'5px 16px', fontSize:12, fontWeight:800, color:'#FCD34D', letterSpacing:'0.7px', textTransform:'uppercase', marginBottom:16 }}>
                          🗽 New York City
                        </div>
                        <h2 style={{ fontSize:'clamp(22px,3.2vw,44px)', fontWeight:900, lineHeight:1.05, color:'#fff', margin:'0 0 12px' }}>
                          Your Pets Deserve<br />
                          <span style={{ color:'#FCD34D' }}>NYC Speed.</span>
                        </h2>
                        <p style={{ fontSize:13.5, lineHeight:1.65, color:'rgba(255,255,255,0.78)', margin:'0 0 18px', maxWidth:310 }}>
                          Same-day delivery across all 5 boroughs. Order by 2 PM — your furry family gets it <strong style={{ color:'#fff' }}>today.</strong>
                        </p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
                          {[['🟢','Same-Day Delivery'],['⚡','2-Hour Express'],['📦','Free over $49']].map(([icon,label])=>(
                            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:100, padding:'5px 12px', fontSize:11.5, fontWeight:700, color:'#fff' }}>
                              {icon} {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                }

                // ── Regular Image Slide ────────────────────────────
                const imageUrl = slide.leftImage || slide.imageUrl;
                const imgEl = (
                  <img
                    src={normalizeImageUrl(imageUrl, { width: 1920, height: 720, format: 'auto' })}
                    srcSet={generateSrcSet(imageUrl, [640, 768, 1024, 1280, 1920], { format: 'auto' })}
                    sizes="100vw"
                    alt={slide.title || 'Banner'}
                    width={1920}
                    height={720}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding={index === 0 ? 'sync' : 'async'}
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'cover', willChange: index === 0 ? 'contents' : undefined }}
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      if (t.src !== imageUrl) t.src = imageUrl;
                    }}
                  />
                );

                if (slide.link) {
                  return (
                    <Link
                      key={slide._id || slide.id}
                      to={slide.link}
                      className={`absolute inset-0 transition-all duration-1000 block ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                      {imgEl}
                    </Link>
                  );
                }

                return (
                  <div
                    key={slide._id || slide.id}
                    className={`absolute inset-0 transition-all duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    {imgEl}
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button onClick={prevSlide}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-blue-600 p-2 md:p-3 rounded-full transition-all shadow-lg hover:shadow-xl z-20 transform hover:scale-110 duration-300"
                  aria-label="Previous slide" style={{ minWidth: '44px', minHeight: '44px' }}>
                  <ChevronLeft size={20} className="md:w-6 md:h-6" />
                </button>
                <button onClick={nextSlide}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-blue-600 p-2 md:p-3 rounded-full transition-all shadow-lg hover:shadow-xl z-20 transform hover:scale-110 duration-300"
                  aria-label="Next slide" style={{ minWidth: '44px', minHeight: '44px' }}>
                  <ChevronRight size={20} className="md:w-6 md:h-6" />
                </button>
              </>
            )}

            {/* Slide Indicators */}
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goToSlide(i)}
                    className={`rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-2' : 'bg-gray-400 hover:bg-gray-600 w-2 h-2'}`}
                    aria-label={`Go to slide ${i + 1}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSlideshow;
