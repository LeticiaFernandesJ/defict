import { supabase } from './supabase';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSuportado(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Pede permissão, cria a subscription de Web Push e salva em push_subscriptions.
 * Requer VITE_VAPID_PUBLIC_KEY e o service worker registrado (vite-plugin-pwa).
 */
export async function ativarNotificacoes(userId: string): Promise<{ ok: boolean; erro?: string }> {
  if (!pushSuportado()) return { ok: false, erro: 'Notificações não são suportadas neste navegador.' };
  if (!VAPID_PUBLIC) return { ok: false, erro: 'VITE_VAPID_PUBLIC_KEY não configurada no frontend.' };

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return { ok: false, erro: 'Permissão de notificações negada.' };

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
  });

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, erro: 'Falha ao obter a subscription.' };
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      usuario_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: 'usuario_id,endpoint' },
  );
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

/** true se já há permissão concedida e uma subscription ativa. */
export async function jaAtivado(): Promise<boolean> {
  if (!pushSuportado() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
