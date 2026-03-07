import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { getObservations, getStats } from '../api';
import { LOCATION_LABELS, AXES, CHART_COLORS } from '../lib/constants';
import BackButton from '../components/BackButton';
import LoadingScreen from '../components/LoadingScreen';
import ObservationTimelineCard from '../components/ObservationTimelineCard';
import { ChartBarIcon, CalendarDaysIcon, MapPinIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const chartOptionsBase = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 11 } } }
  }
};

export default function ParentView() {
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getObservations(), getStats()])
      .then(([obs, s]) => {
        setObservations(obs);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingScreen message="Chargement du tableau de bord…" />;
  }

  const totalObs = stats?.totalObservations ?? 0;
  const globalScore = stats?.globalScore ?? null;
  const totalEval = stats?.totalEvaluations ?? 0;

  const pieData =
    stats?.byLocation?.length
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
  const hasBarData = perAxis.some((x) => x.positive + x.negative > 0);
  const barData = hasBarData
    ? {
        labels: perAxis.map((x) => AXES.find((a) => a.key === x.axis)?.short || x.axis),
        datasets: [
          { label: 'Positif', data: perAxis.map((x) => x.positive), backgroundColor: '#22c55e', borderRadius: 6 },
          { label: 'Difficulté', data: perAxis.map((x) => x.negative), backgroundColor: '#ef4444', borderRadius: 6 }
        ]
      }
    : null;

  const byDate = stats?.byDate ?? [];
  const trendData =
    byDate.filter((d) => d.score != null).length > 0
      ? {
          labels: byDate.map((d) => d.date),
          datasets: [
            {
              label: '% positif',
              data: byDate.map((d) => d.score ?? 0),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              fill: true,
              tension: 0.3
            }
          ]
        }
      : null;

  return (
    <div className="min-h-dvh pb-8 app-page bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/90 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <BackButton to="/parent" />
        <h1 className="text-xl font-bold text-slate-800 flex-1">Tableau de bord</h1>
      </header>

      <main className="p-4 space-y-6">
        {/* Cartes récap */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <CalendarDaysIcon className="w-5 h-5" />
              <span className="text-xs font-medium">Observations</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{totalObs}</p>
            <p className="text-slate-400 text-xs mt-0.5">au total</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <ArrowTrendingUpIcon className="w-5 h-5" />
              <span className="text-xs font-medium">Taux positif</span>
            </div>
            {totalEval > 0 && globalScore != null ? (
              <>
                <p className="text-2xl font-bold text-green-600">{globalScore} %</p>
                <p className="text-slate-400 text-xs mt-0.5">{totalEval} éval. renseignées</p>
              </>
            ) : (
              <p className="text-slate-400 text-sm mt-1">Pas encore de données</p>
            )}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-slate-500" />
            Dernières observations
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {observations.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm shadow-card border border-slate-100">
                Aucune observation pour le moment
              </div>
            ) : (
              observations.map((obs) => <ObservationTimelineCard key={obs.id} obs={obs} />)
            )}
          </div>
        </section>

        {/* Répartition par lieu */}
        <section>
          <h2 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-slate-500" />
            Répartition par lieu
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 h-56">
            {pieData && pieData.datasets[0].data.some((n) => n > 0) ? (
              <Pie data={pieData} options={chartOptionsBase} />
            ) : (
              <p className="text-slate-500 text-sm h-full flex items-center justify-center">Aucune donnée</p>
            )}
          </div>
        </section>

        {/* Positif / difficulté par axe (uniquement axes renseignés) */}
        <section>
          <h2 className="text-slate-700 font-semibold mb-3">Positif vs difficulté par axe</h2>
          <p className="text-slate-500 text-xs mb-2">Seules les évaluations renseignées sont comptées.</p>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 h-56">
            {barData ? (
              <Bar
                data={barData}
                options={{
                  ...chartOptionsBase,
                  scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true }
                  }
                }}
              />
            ) : (
              <p className="text-slate-500 text-sm h-full flex items-center justify-center">Aucune donnée</p>
            )}
          </div>
        </section>

        {/* Tendance dans le temps */}
        <section>
          <h2 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-slate-500" />
            Évolution du taux positif
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 h-56">
            {trendData ? (
              <Line
                data={trendData}
                options={{
                  ...chartOptionsBase,
                  scales: {
                    x: { grid: { display: false } },
                    y: { min: 0, max: 100 }
                  }
                }}
              />
            ) : (
              <p className="text-slate-500 text-sm h-full flex items-center justify-center">Aucune donnée</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
