import { useEffect } from 'react';
import { syncObservations, getPendingObservations, setPendingObservations } from '../api';
import { LOCATIONS } from '../lib/constants';
import ContextCard from '../components/ContextCard';

export default function Home() {
  useEffect(() => {
    const pending = getPendingObservations();
    if (pending.length && navigator.onLine) {
      syncObservations(pending)
        .then(() => setPendingObservations([]))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-dvh flex flex-col app-page">
      <header className="pt-6 pb-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Auguste</h1>
        <p className="text-slate-500 text-sm mt-0.5">Choisir un contexte</p>
      </header>

      <main className="flex-1 px-4 pb-4 space-y-3">
        {LOCATIONS.map((loc) => (
          <ContextCard
            key={loc.id}
            to={loc.to}
            label={loc.label}
            color={loc.color}
            iconName={loc.icon}
          />
        ))}
      </main>

      <section className="p-4 pt-2 border-t border-slate-200/80 bg-slate-50/50">
        <ContextCard to="/parent" label="Vue Parent" color="parent" iconName="Eye" isParent />
        <p className="text-slate-500 text-xs text-center mt-2">Accès réservé aux parents</p>
      </section>
    </div>
  );
}
