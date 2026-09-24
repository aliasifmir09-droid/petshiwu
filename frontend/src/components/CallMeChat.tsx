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

const CallMeChat = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([
    {
      role: 'desk',
      text: 'Want a person on the phone? Drop your number here. We call within a minute.',
    },
  ]);
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
          text: `That does not look like a US number. Try 347-555-0100, or call us now at ${SUPPORT_DISPLAY}.`,
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
        `We are calling ${display} now. Stay by the phone — a person will ring you within a minute.`;
      setRequested(true);
      setLines((prev) => [...prev, { role: 'desk', text: confirm }]);
    } catch (err: any) {
      const status = err?.response?.status;
      const fallback =
        err?.response?.data?.message ||
        `Could not reach the desk. Call ${SUPPORT_DISPLAY} — a person answers 24/7.`;
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
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-24 z-50 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl border border-[#E4DED2] shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '28rem' }}
          role="dialog"
          aria-label="Call me chat"
        >
          <div className="bg-[#12235A] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Phone size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Call me</p>
              <p className="text-xs text-[#E8C872]">A person calls within a minute</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-xl leading-none px-1"
              aria-label="Close call me chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3 bg-[#F7F4EE]">
            {lines.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={`max-w-[88%] text-sm px-3 py-2 rounded-2xl leading-relaxed ${
                  line.role === 'user'
                    ? 'self-end bg-[#1E3A8A] text-white rounded-br-sm'
                    : 'self-start bg-white text-gray-800 border border-[#E4DED2] rounded-bl-sm'
                }`}
              >
                {line.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#E4DED2] bg-white px-3 py-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <a
                href={`tel:${SUPPORT_TEL}`}
                className="flex-1 text-center text-xs font-semibold border border-[#1E3A8A] text-[#1E3A8A] rounded-xl py-2"
              >
                Call {SUPPORT_DISPLAY}
              </a>
              <button
                type="button"
                onClick={() => {
                  inputRef.current?.focus();
                  setLines((prev) =>
                    prev.some((line) => line.text.includes('Type your number'))
                      ? prev
                      : [
                          ...prev,
                          {
                            role: 'desk',
                            text: 'Type your number — like 347-555-0100 — and we call you.',
                          },
                        ]
                  );
                }}
                className="flex-1 text-xs font-semibold bg-[#E8C872] text-[#12235A] rounded-xl py-2"
              >
                Call me
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
                className="flex-1 bg-[#F7F4EE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A] placeholder:text-gray-400"
                aria-label="Your phone number"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim() || sending}
                className="bg-[#1E3A8A] disabled:bg-gray-200 text-white rounded-xl px-3 py-2 text-sm font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 bg-[#1E3A8A] hover:bg-[#12235A] text-white rounded-full px-4 py-3 flex items-center gap-2 shadow-lg"
        aria-label={open ? 'Close call me chat' : 'Open call me chat'}
      >
        <Phone size={18} />
        <span className="text-sm font-semibold">{open ? 'Close' : 'Call me'}</span>
      </button>
    </>
  );
};

export default CallMeChat;
