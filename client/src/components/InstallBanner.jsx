import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const DISMISS_KEY = 'suivi-auguste-install-dismissed';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (standalone || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-800 text-white rounded-2xl p-4 shadow-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <ArrowDownTrayIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Installer l&apos;app</p>
          <p className="text-white/80 text-xs">Utilisez Auguste comme une app sur votre téléphone</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 px-4 py-2 rounded-xl bg-white text-slate-800 text-sm font-bold active:scale-95"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
