import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

// Captura o beforeinstallprompt (Android/desktop) e instrui iOS manualmente.
let deferredPrompt: Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null =
  null;

export function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('deficit_pwa_dismissed');

    if (standalone || dismissed) return;

    if (ios) {
      setIsIos(true);
      setShowBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as typeof deferredPrompt;
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIos) return handleDismiss();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') handleDismiss();
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('deficit_pwa_dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm lg:bottom-6">
      <div className="flex items-start gap-4 rounded-3xl bg-primary p-5 text-white shadow-2xl animate-fadeInUp">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-accent">
          <Smartphone size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instalar Déficit App</p>
          {isIos ? (
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Toque em <strong>Compartilhar</strong> (⬆) e depois em{' '}
              <strong>Adicionar à Tela Inicial</strong>
            </p>
          ) : (
            <p className="mt-1 text-xs text-white/70">Acesse offline com a experiência completa</p>
          )}
          {!isIos && (
            <button
              onClick={handleInstall}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs text-white transition-colors hover:brightness-95"
            >
              <Download size={13} /> Instalar agora
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/50 transition-colors hover:text-white"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
