import { useEffect, useRef, useState } from 'react';
import { useGoogleLoginConfig } from '@/config/google';
import { authService } from '@/services/auth';
import { extractErrorMessage } from '@/utils/errorHandler';

type GoogleSignInButtonProps = {
  onSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
};

const GSI_SRC = 'https://accounts.google.com/gsi/client';

const loadGoogleScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in failed to load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in failed to load.'));
    document.head.appendChild(script);
  });

const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
  const { clientId, enabled, ready: configReady } = useGoogleLoginConfig();
  const buttonRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!configReady || !enabled || !clientId) return;
    let cancelled = false;

    const start = async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              if (!response.credential) {
                onErrorRef.current('Google did not return a sign-in credential.');
                return;
              }
              const result = await authService.loginWithGoogle(response.credential);
              if (!result?.success) {
                throw new Error(result?.message || 'Google sign-in failed.');
              }
              await onSuccessRef.current();
            } catch (error) {
              onErrorRef.current(extractErrorMessage(error) || 'Google sign-in failed.');
            }
          },
          ux_mode: 'popup',
          auto_select: false,
        });
        buttonRef.current.innerHTML = '';
        const width = Math.max(240, Math.min(buttonRef.current.parentElement?.clientWidth || 336, 400));
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width,
          logo_alignment: 'left',
        });
        setReady(true);
      } catch (error) {
        onErrorRef.current(extractErrorMessage(error) || 'Google sign-in failed to load.');
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [clientId, configReady, enabled]);

  if (configReady && !enabled) return null;

  return (
    <div className="w-full">
      {!ready && (
        <div className="flex h-11 items-center justify-center rounded-md border border-gray-200 bg-white text-sm text-gray-500">
          Loading Google…
        </div>
      )}
      <div ref={buttonRef} className={`flex justify-center ${ready ? '' : 'hidden'}`} />
    </div>
  );
};

export default GoogleSignInButton;
