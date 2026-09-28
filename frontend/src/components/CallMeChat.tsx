import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import {
  extractCallbackPhone,
  formatCallbackPhone,
  isCallbackChatHiddenPath,
} from '@/utils/callbackPhone';

type ChatLine = { role: 'user' | 'desk'; text: string };

const SUPPORT_TEL = '+18002592605';
const SUPPORT_DISPLAY = '+1 (800) 259-2605';

const OPENING =
  "Why wait? We'll call you. Need something cleared up — a bag, an order, what's in stock tonight? Leave your number. A person rings you in a minute.";

const CallMeChat = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([{ role: 'desk', text: OPENING }]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden = isCallbackChatHiddenPath(location.pathname);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, lines]);

  if (hidden) return null;

  const requestCall = async (raw: string) => {
    const phone = extractCallbackPhone(raw);
    if (!phone) {
      setLines((prev) => [
        ...prev,
        {
          role: 'desk',
          text: `That doesn't look like a US number yet. Try 347-555-0100 — or tap Call us now.`,
        },
      ]);
      return;
    }
    if (sending || requested) return;

    const display = formatCallbackPhone(phone);
    setSending(true);
    try {
      const res = await api.post(
        '/v1/contact/callback',
        {
          phone,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
          message: raw.trim(),
          pagePath: location.pathname,
        },
        { skipAuth: true }
      );
      const confirm =
        res.data?.message ||
        `Don't wait. We're calling ${display} now. Stay close — a person will ring you within a minute.`;
      setRequested(true);
      setLines((prev) => [...prev, { role: 'desk', text: confirm }]);
    } catch (err: any) {
      const status = err?.response?.status;
      const fallback =
        err?.response?.data?.message ||
        `We couldn't reach the desk just now. Call ${SUPPORT_DISPLAY} — a person answers 24/7.`;
      if (status === 429) setRequested(true);
      setLines((prev) => [...prev, { role: 'desk', text: fallback }]);
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setLines((prev) => [...prev, { role: 'user', text }]);
    await requestCall(text);
  };

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-[min(23rem,calc(100vw-2rem))] bg-white rounded-[1.75rem] shadow-[0_20px_50px_rgba(11,18,36,0.28)] flex flex-col overflow-hidden"
          style={{ height: '32rem' }}
          role="dialog"
          aria-label="Call me chat"
        >
          <div className="bg-[#12235A] text-white px-5 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-[#E8C872] text-[#12235A] flex items-center justify-center shrink-0">
                <Phone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#E8C872]">
                  A person · not a bot
                </p>
                <h2 className="mt-1 text-[1.65rem] font-extrabold leading-[1.05] tracking-tight">
                  Why wait?
                  <br />
                  We&apos;ll call you.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white text-2xl leading-none px-1 -mt-1"
                aria-label="Close call me chat"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-sm text-blue-100 leading-snug">
              Need something cleared up? Leave your number. We ring you within a minute.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['No hold', '24/7', 'Same-day NYC'].map((chip) => (
                <span
                  key={chip}
                  className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#12235A] bg-[#E8C872] rounded-full px-2.5 py-1"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#F7F4EE]">
            {lines.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={`max-w-[90%] text-[15px] px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                  line.role === 'user'
                    ? 'self-end bg-[#1E3A8A] text-white rounded-br-sm'
                    : 'self-start bg-white text-[#111827] border border-[#E4DED2] rounded-bl-sm shadow-sm'
                }`}
              >
                {line.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#E4DED2] bg-white px-4 py-3.5 flex flex-col gap-2.5">
            <div className="flex gap-2">
              <a
                href={`tel:${SUPPORT_TEL}`}
                className="flex-1 text-center text-xs font-bold border border-[#1E3A8A] text-[#1E3A8A] rounded-full py-2.5"
              >
                Call us now
              </a>
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.focus();
                  setLines((prev) =>
                    prev.some((line) => line.text.includes('Drop your number'))
                      ? prev
                      : [
                          ...prev,
                          {
                            role: 'desk',
                            text: "Drop your number — like 347-555-0100 — and we'll call you. No hold. No form.",
                          },
                        ]
                  );
                }}
                className="flex-1 text-xs font-bold bg-[#E8C872] text-[#12235A] rounded-full py-2.5"
              >
                We&apos;ll call you
              </button>
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Drop your number"
                disabled={sending}
                className="flex-1 bg-[#F7F4EE] rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A] placeholder:text-gray-400"
                aria-label="Your phone number"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim() || sending}
                className="bg-[#1E3A8A] disabled:bg-gray-200 text-white rounded-full px-4 py-2.5 text-sm font-bold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 bg-[#1E3A8A] hover:bg-[#12235A] text-white rounded-full pl-3 pr-4 py-3 flex items-center gap-2.5 shadow-[0_12px_28px_rgba(30,58,138,0.45)]"
          aria-label="Open call me chat"
        >
          <span className="w-9 h-9 rounded-full bg-[#E8C872] text-[#12235A] flex items-center justify-center">
            <Phone size={16} />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[10px] font-semibold tracking-[0.14em] uppercase text-blue-200">
              Why wait?
            </span>
            <span className="block text-sm font-extrabold">We&apos;ll call you</span>
          </span>
        </button>
      )}
    </>
  );
};

export default CallMeChat;
