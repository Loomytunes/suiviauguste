import { useState, useEffect } from 'react';
import { SignalSlashIcon } from '@heroicons/react/24/outline';

export default function OfflineBar() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    window.addEventListener('online', set);
    window.addEventListener('offline', set);
    return () => {
      window.removeEventListener('online', set);
      window.removeEventListener('offline', set);
    };
  }, []);

  if (online) return null;

  return (
    <>
      <div className="h-12 flex-shrink-0" aria-hidden="true" />
      <div className="fixed top-0 left-0 right-0 z-[100] h-12 bg-amber-500 text-amber-900 px-4 flex items-center justify-center gap-2 text-sm font-medium safe-top">
        <SignalSlashIcon className="w-5 h-5 shrink-0" />
        <span className="truncate">Hors ligne — envoi à la reconnexion</span>
      </div>
    </>
  );
}
