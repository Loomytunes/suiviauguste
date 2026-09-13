import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getObservations, getStats } from '../api';
import { LOCATION_LABELS, AXES, CHART_COLORS } from '../lib/constants';
import LocationBadge from '../components/LocationBadge';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const POLL_MS = 5000;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 10, usePointStyle: true, font: { size: 12 }, color: '#334155' } }
  }
};

function AxisPill({ value, short }) {
  if (value !== 0 && value !== 1) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
        value === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {value === 1 ? '🙂' : '🙁'} {short}
    </span>
  );
}

export default function EcranDashboard() {
  const [observations, setObservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState(false);
  const lastIdRef = useRef(null);

  const refresh = async () => {
    try {
      const [obs, s] = await Promise.all([getObservations(), getStats()]);
      const newestId = obs[0]?.id ?? null;
      if (lastIdRef.current != null && newestId != null && newestId !== lastIdRef.current) {
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      }
      lastIdRef.current = newestId;
      setObservations(obs.slice(0, 12));
      setStats(s);
      setUpdatedAt(new Date());
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const totalObs = stats?.totalObservations ?? 0;
  const globalScore = stats?.globalScore ?? null;
  const totalEval = stats?.totalEvaluations ?? 0;

  const pieData =
    stats?.byLocation?.length > 0
      ? {
          labels: stats.byLocation.map((x) => LOCATION_LABELS[x.location] || x.location),
          datasets: [
            {
              data: stats.byLocation.map((x) => x.count),
              backgroundColor: CHART_COLORS.slice(0, stats.byLocation.length),
              borderWidth: 0
            }
          ]
        }
      : null;

  const perAxis = stats?.perAxis ?? [];
  const hasBar = perAxis.some((x) => x.positive + x.negative > 0);
  const barData = hasBar
    ? {
        labels: perAxis.map((x) => AXES.find((a) => a.key === x.axis)?.short || x.axis),
        datasets: [
          { label: 'Positif', data: perAxis.map((x) => x.positive), backgroundColor: '#22c55e', borderRadius: 6 },
          { label: 'Difficulté', data: perAxis.map((x) => x.negative), backgroundColor: '#ef4444', borderRadius: 6 }
        ]
      }
    : null;

  const timeStr = updatedAt
    ? updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '…';

  return (
    <div
      className={`min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6 overflow-hidden transition-shadow duration-500 ${
        flash ? 'ring-4 ring-inset ring-emerald-400' : ''
      }`}
    >
      <header className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Auguste</h1>
          <p className="text-slate-400 text-sm">Tableau de suivi en direct</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${error ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-slate-300">{error ? 'Hors ligne' : 'En direct'}</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">MAJ {timeStr}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Observations</p>
          <p className="text-3xl md:text-4xl font-bold mt-1">{totalObs}</p>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Taux positif</p>
          <p className="text-3xl md:text-4xl font-bold mt-1 text-emerald-400">
            {globalScore != null ? `${globalScore} %` : '—'}
          </p>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Évaluations</p>
          <p className="text-3xl md:text-4xl font-bold mt-1">{totalEval}</p>
        </div>
        <div className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Dernière</p>
          <p className="text-lg md:text-xl font-semibold mt-2 truncate">
            {observations[0]
              ? `${LOCATION_LABELS[observations[0].location] || observations[0].location} · ${observations[0].time}`
              : 'Aucune'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100dvh-11rem)] min-h-[320px]">
        <section className="rounded-2xl bg-white/95 text-slate-800 p-4 flex flex-col overflow-hidden border border-white/20">
          <h2 className="font-semibold mb-3 text-slate-700">Dernières observations</h2>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {observations.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">En attente d&apos;observations…</p>
            ) : (
              observations.map((obs) => (
                <article
                  key={obs.id}
                  className="rounded-xl bg-slate-50 border border-slate-100 p-3 animate-fade-in"
                >
                  <div className="flex justify-between items-start gap-2">
                    <LocationBadge location={obs.location} label={LOCATION_LABELS[obs.location] || obs.location} />
                    <time className="text-slate-500 text-xs shrink-0">
                      {obs.date} · {obs.time}
                    </time>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {AXES.map(({ key, short }) => (
                      <AxisPill key={key} value={obs[key]} short={short} />
                    ))}
                  </div>
                  {obs.notes ? <p className="text-slate-600 text-xs mt-2 line-clamp-2">{obs.notes}</p> : null}
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid grid-rows-2 gap-4 min-h-0">
          <section className="rounded-2xl bg-white/95 text-slate-800 p-4 overflow-hidden border border-white/20">
            <h2 className="font-semibold mb-2 text-slate-700">Répartition par lieu</h2>
            <div className="h-[calc(100%-1.75rem)]">
              {pieData ? (
                <Pie data={pieData} options={chartOptions} />
              ) : (
                <p className="text-slate-500 text-sm h-full flex items-center justify-center">Pas de données</p>
              )}
            </div>
          </section>
          <section className="rounded-2xl bg-white/95 text-slate-800 p-4 overflow-hidden border border-white/20">
            <h2 className="font-semibold mb-2 text-slate-700">Positif vs difficulté</h2>
            <div className="h-[calc(100%-1.75rem)]">
              {barData ? (
                <Bar
                  data={barData}
                  options={{
                    ...chartOptions,
                    scales: {
                      x: { stacked: true, grid: { display: false } },
                      y: { stacked: true, ticks: { precision: 0 } }
                    }
                  }}
                />
              ) : (
                <p className="text-slate-500 text-sm h-full flex items-center justify-center">Pas de données</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
