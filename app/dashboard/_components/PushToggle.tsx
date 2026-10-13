'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

const panel = 'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Prijavite se ponovo.');
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token };
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type PushState = 'loading' | 'ios-install' | 'unsupported' | 'unconfigured' | 'denied' | 'off' | 'on';

export default function PushToggle() {
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    // iOS/iPadOS: web push radi samo iz aplikacije dodane na početni ekran (iOS 16.4+).
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const standalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !standalone) return setState('ios-install');
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return setState('unsupported');
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const query = existing ? '?endpoint=' + encodeURIComponent(existing.endpoint) : '';
      const response = await fetch('/api/dashboard/push' + query, { headers: await authHeaders(), cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.configured) return setState('unconfigured');
      if (Notification.permission === 'denied') return setState('denied');
      setState(existing && result.subscribed ? 'on' : 'off');
    } catch {
      setState('unconfigured');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const headers = await authHeaders();
      const keyResponse = await fetch('/api/dashboard/push', { headers, cache: 'no-store' });
      const keyResult = await keyResponse.json();
      if (!keyResult.publicKey) throw new Error('Push obavijesti nisu podešene na serveru.');
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyResult.publicKey),
        }));
      const response = await fetch('/api/dashboard/push', {
        method: 'POST',
        headers,
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Pretplata nije sačuvana.');
      setState('on');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uključivanje nije uspjelo.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/dashboard/push', {
          method: 'DELETE',
          headers: await authHeaders(),
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        // Pretplata preglednika se ne ukida: isti uređaj može primati obavijesti i za druge firme.
      }
      setState('off');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Isključivanje nije uspjelo.');
    } finally {
      setBusy(false);
    }
  };

  const text: Record<PushState, string> = {
    loading: 'Provjera obavijesti…',
    'ios-install': 'Na iPhoneu: u Safariju pritisnite Dijeli → „Dodaj na početni ekran“, otvorite POSLO ONE s početnog ekrana, pa se vratite ovdje i uključite obavijesti.',
    unsupported: 'Ovaj preglednik ne podržava push obavijesti. Na iPhoneu prvo dodajte POSLO ONE na početni ekran.',
    unconfigured: 'Push obavijesti još nisu podešene na serveru.',
    denied: 'Obavijesti su blokirane u postavkama preglednika. Dozvolite ih za ovu stranicu.',
    off: 'Obavijesti o novim upitima i rezervacijama su isključene na ovom uređaju.',
    on: 'Obavijesti o novim upitima i rezervacijama su uključene na ovom uređaju.',
  };

  return (
    <div className={`${panel} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">Push obavijesti</p>
        <p className="mt-1 text-xs text-gray-400">{text[state]}</p>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
      {(state === 'off' || state === 'on') && (
        <button
          type="button"
          disabled={busy}
          onClick={state === 'on' ? disable : enable}
          className="min-h-11 shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Trenutak…' : state === 'on' ? 'Isključi' : 'Uključi obavijesti'}
        </button>
      )}
    </div>
  );
}

