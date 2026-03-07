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
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
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

  const barData =
    stats?.perAxis?.length
      ? {
          labels: stats.perAxis.map((x) => AXES.find((a) => a.key === x.axis)?.short || x.axis),
          datasets: [
            { label: 'Positif', data: stats.perAxis.map((x) => x.positive), backgroundColor: '#22c55e', borderRadius: 8 },
            { label: 'Difficulté', data: stats.perAxis.map((x) => x.negative), backgroundColor: '#ef4444', borderRadius: 8 }
          ]
        }
      : null;

  const trendData =
    stats?.byDate?.length
      ? {
          labels: stats.byDate.map((x) => x.date),
          datasets: [
            {
              label: 'Tendance (positif)',
              data: stats.byDate.map((d) => {
                const total = (d.c_pos || 0) + (d.r_pos || 0) + (d.e_pos || 0) + (d.p_pos || 0);
                const count =
                  (d.c_pos || 0) + (d.c_neg || 0) + (d.r_pos || 0) + (d.r_neg || 0) + (d.e_pos || 0) + (d.e_neg || 0) + (d.p_pos || 0) + (d.p_neg || 0);
                return count ? Math.round((total / count) * 4 * 25) : 0;
              }),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        }
      : null;

  return (
    <div className="min-h-dvh pb-8 app-page">
      <header className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80">
        <BackButton to="/parent" />
        <h1 className="text-xl font-bold text-slate-800">Vue Parent</h1>
      </header>

      <main className="p-4 space-y-8">
        <section>
          <h2 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">Timeline</h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {observations.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-500 text-sm shadow-card">
                Aucune observation pour le moment
              </div>
            ) : (
              observations.map((obs) => <ObservationTimelineCard key={obs.id} obs={obs} />)
            )}
          </div>
        </section>

        <section>
          <h2 className="text-slate-700 font-semibold mb-3">Répartition par lieu</h2>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 h-64">
            {pieData ? (
              <Pie data={pieData} options={chartOptionsBase} />
            ) : (
              <p className="text-slate-500 text-sm h-full flex items-center justify-center">Pas de données</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-slate-700 font-semibold mb-3">Positif vs difficulté par axe</h2>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 h-64">
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
              <p className="text-slate-500 text-sm h-full flex items-center justify-center">Pas de données</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-slate-700 font-semibold mb-3">Évolution dans le temps</h2>
          <div className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 h-64">
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
              <p className="text-slate-500 text-sm h-full flex items-center justify-center">Pas de données</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
