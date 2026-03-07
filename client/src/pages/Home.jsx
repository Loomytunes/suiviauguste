import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { syncObservations, getPendingObservations, setPendingObservations } from '../api';

const buttons = [
  { to: '/obs/bus', label: 'Bus', color: 'bg-bus', icon: '🚌' },
  { to: '/obs/cantine', label: 'Cantine', color: 'bg-cantine', icon: '🍽️' },
  { to: '/obs/garderie', label: 'Garderie', color: 'bg-garderie', icon: '🏫' },
  { to: '/obs/recreation', label: 'Récréation', color: 'bg-recreation', icon: '⚽' },
  { to: '/obs/classe', label: 'Classe', color: 'bg-classe', icon: '📚' },
  { to: '/parent', label: 'Vue Parent', color: 'bg-parent', icon: '👁️' }
];

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
    <div className="min-h-dvh bg-slate-100 p-4 pb-8 flex flex-col">
      <h1 className="text-xl font-bold text-slate-800 text-center py-4">Auguste</h1>
      <div className="flex-1 grid gap-4">
        {buttons.map((b) => (
          <Link
            key={b.to}
            to={b.to}
            className={`${b.color} text-white rounded-2xl p-6 flex items-center justify-center gap-4 shadow-lg active:scale-[0.98] min-h-[72px] text-lg font-medium`}
          >
            <span className="text-3xl">{b.icon}</span>
            <span>{b.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
