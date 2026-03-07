import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function LoadingScreen({ message = 'Chargement…' }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center mb-4 animate-pulse">
        <ChartBarIcon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-500 text-sm font-medium">{message}</p>
    </div>
  );
}
