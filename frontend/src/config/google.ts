import { useEffect, useState } from 'react';
import { authService } from '@/services/auth';

export const bakedGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

/** @deprecated Prefer resolveGoogleClientId / useGoogleLoginConfig. Vite env is optional. */
export const googleClientId = bakedGoogleClientId;

/** @deprecated Prefer useGoogleLoginConfig. A missing Vite env no longer means Google login is off. */
export const isGoogleLoginConfigured = Boolean(bakedGoogleClientId);

let resolvedClientId: string | undefined;
let inflight: Promise<string> | null = null;

export const resetGoogleClientIdCache = () => {
  resolvedClientId = undefined;
  inflight = null;
};

export const resolveGoogleClientId = async (): Promise<string> => {
  if (resolvedClientId !== undefined) return resolvedClientId;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const data = await authService.getGoogleConfig();
      resolvedClientId = String(data?.clientId || bakedGoogleClientId).trim();
    } catch {
      resolvedClientId = bakedGoogleClientId;
    }
    return resolvedClientId;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
};

export const useGoogleLoginConfig = () => {
  const [clientId, setClientId] = useState(bakedGoogleClientId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveGoogleClientId().then((id) => {
      if (cancelled) return;
      setClientId(id);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    clientId,
    enabled: Boolean(clientId),
    ready,
  };
};
