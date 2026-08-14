import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = 'petshiwu_install_dismissed';

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as Navigator & { standalone?: boolean }).standalone;

const InstallAppBanner = () => {
  const [deferred, setDeferred] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    setIos(isIos());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (isIos()) setHidden(false);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setHidden(true);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-3 right-3 z-[55] mx-auto max-w-lg rounded-2xl border border-blue-200 bg-white p-3 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
          <Download size={18} />
        </div>
        <div className="flex-1">
          <p className="font-black text-gray-900 text-sm">Put Petshiwu on your home screen</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {ios
              ? 'Tap Share, then Add to Home Screen. It opens like an app — do this before launch day.'
              : 'Install now. After launch, most people never tap “install.”'}
          </p>
          <div className="mt-2 flex gap-2">
            {!ios && deferred && (
              <button
                type="button"
                onClick={async () => {
                  deferred.prompt();
                  await deferred.userChoice;
                  dismiss();
                }}
                className="rounded-full bg-blue-700 px-3 py-1.5 text-xs font-bold text-white"
              >
                Install app
              </button>
            )}
            {ios && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                <Share size={12} /> Share → Add to Home Screen
              </span>
            )}
            <button type="button" onClick={dismiss} className="text-xs font-semibold text-gray-400">
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-gray-400">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallAppBanner;
