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

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

const locationLabels = {
  bus: 'Bus',
  cantine: 'Cantine',
  garderie: 'Garderie',
  recreation: 'Récréation',
  classe: 'Classe'
};

const axisLabels = {
  concentration: 'Concentration',
  respect_consigne: 'Consignes',
  emotion_management: 'Émotions',
  respect_peers: 'Camarades'
};

const colors = ['#2563eb', '#ea580c', '#7c3aed', '#16a34a', '#4f46e5'];

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
    return (
      <div className="min-h-dvh bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Chargement…</p>
      </div>
    );
  }

  const pieData = stats?.byLocation?.length
    ? {
        labels: stats.byLocation.map((x) => locationLabels[x.location] || x.location),
        datasets: [{ data: stats.byLocation.map((x) => x.count), backgroundColor: colors.slice(0, stats.byLocation.length) }]
      }
    : null;

  const barData = stats?.perAxis?.length
    ? {
        labels: stats.perAxis.map((x) => axisLabels[x.axis] || x.axis),
        datasets: [
          { label: 'Positif', data: stats.perAxis.map((x) => x.positive), backgroundColor: '#22c55e' },
          { label: 'Difficulté', data: stats.perAxis.map((x) => x.negative), backgroundColor: '#ef4444' }
        ]
      }
    : null;

  const trendData = stats?.byDate?.length
    ? {
        labels: stats.byDate.map((x) => x.date),
        datasets: [
          {
            label: 'Positif (moyenne axes)',
            data: stats.byDate.map((d) => {
              const total = (d.c_pos || 0) + (d.r_pos || 0) + (d.e_pos || 0) + (d.p_pos || 0);
              const count = (d.c_pos || 0) + (d.c_neg || 0) + (d.r_pos || 0) + (d.r_neg || 0) + (d.e_pos || 0) + (d.e_neg || 0) + (d.p_pos || 0) + (d.p_neg || 0);
              return count ? Math.round((total / count) * 4 * 25) : 0;
            }),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true
          }
        ]
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  return (
    <div className="min-h-dvh bg-slate-100 p-4 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={() => navigate('/parent')} className="p-2 rounded-full bg-white shadow text-slate-700">←</button>
        <h1 className="text-lg font-bold text-slate-800">Vue Parent</h1>
      </div>

      <section className="mb-6">
        <h2 className="text-slate-700 font-semibold mb-3">Timeline</h2>
        <div className="space-y-3 max-h-[280px] overflow-y-auto">
          {observations.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucune observation</p>
          ) : (
            observations.map((obs) => (
              <div key={obs.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-slate-800">{locationLabels[obs.location] || obs.location}</span>
                  <span className="text-slate-500 text-sm">{obs.date} {obs.time}</span>
                </div>
                <div className="flex gap-2 mt-1 text-sm">
                  <span className={obs.concentration === 1 ? 'text-green-600' : 'text-red-600'}>Conc.</span>
                  <span className={obs.respect_consigne === 1 ? 'text-green-600' : 'text-red-600'}>Cons.</span>
                  <span className={obs.emotion_management === 1 ? 'text-green-600' : 'text-red-600'}>Émot.</span>
                  <span className={obs.respect_peers === 1 ? 'text-green-600' : 'text-red-600'}>Cam.</span>
                </div>
                {obs.notes && <p className="text-slate-600 text-sm mt-1">{obs.notes}</p>}
                <p className="text-slate-400 text-xs mt-1">{obs.staff_email}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-slate-700 font-semibold mb-3">Lieux</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm h-64">
          {pieData ? <Pie data={pieData} options={chartOptions} /> : <p className="text-slate-500 text-sm">Pas de données</p>}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-slate-700 font-semibold mb-3">Positif vs difficulté par axe</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm h-64">
          {barData ? <Bar data={barData} options={{ ...chartOptions, scales: { x: { stacked: true }, y: { stacked: true } } }} /> : <p className="text-slate-500 text-sm">Pas de données</p>}
        </div>
      </section>

      <section>
        <h2 className="text-slate-700 font-semibold mb-3">Évolution dans le temps</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm h-64">
          {trendData ? <Line data={trendData} options={chartOptions} /> : <p className="text-slate-500 text-sm">Pas de données</p>}
        </div>
      </section>
    </div>
  );
}
