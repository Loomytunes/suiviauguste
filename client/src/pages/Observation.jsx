import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitObservation, addPendingObservation } from '../api';

const locationLabels = {
  bus: 'Bus',
  cantine: 'Cantine',
  garderie: 'Garderie',
  recreation: 'Récréation',
  classe: 'Classe'
};

const axes = [
  { key: 'concentration', label: 'Concentration / Agitation' },
  { key: 'respect_consigne', label: 'Respect des consignes et de l\'adulte' },
  { key: 'emotion_management', label: 'Gestion des émotions' },
  { key: 'respect_peers', label: 'Respect de mes camarades' }
];

export default function Observation() {
  const { location } = useParams();
  const navigate = useNavigate();
  const [staffEmail, setStaffEmail] = useState('');
  const [values, setValues] = useState({ concentration: null, respect_consigne: null, emotion_management: null, respect_peers: null });
  const [notes, setNotes] = useState({});
  const [sending, setSending] = useState(false);

  const setAxis = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));
  const setNote = (key, v) => setNotes((prev) => ({ ...prev, [key]: v }));

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  const payload = {
    date,
    time,
    location: location || 'classe',
    staff_email: staffEmail.trim(),
    concentration: values.concentration === true ? 1 : 0,
    respect_consigne: values.respect_consigne === true ? 1 : 0,
    emotion_management: values.emotion_management === true ? 1 : 0,
    respect_peers: values.respect_peers === true ? 1 : 0,
    notes: Object.values(notes).filter(Boolean).join(' | ') || null
  };

  const canSubmit = staffEmail.trim() && values.concentration !== null && values.respect_consigne !== null && values.emotion_management !== null && values.respect_peers !== null;

  const handleSubmit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    try {
      if (navigator.onLine) {
        await submitObservation(payload);
      } else {
        addPendingObservation(payload);
      }
      navigate('/', { replace: true });
    } catch {
      addPendingObservation(payload);
      navigate('/', { replace: true });
    } finally {
      setSending(false);
    }
  };

  const label = locationLabels[location] || location;

  return (
    <div className="min-h-dvh bg-slate-100 p-4 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full bg-white shadow text-slate-700">←</button>
        <h1 className="text-lg font-bold text-slate-800">{label}</h1>
      </div>

      <label className="block mb-2 text-slate-600 text-sm">Email du personnel</label>
      <input
        type="email"
        value={staffEmail}
        onChange={(e) => setStaffEmail(e.target.value)}
        placeholder="email@ecole.fr"
        className="w-full p-4 rounded-xl border border-slate-200 text-base mb-6"
      />

      {axes.map(({ key, label: axisLabel }) => (
        <div key={key} className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-slate-700 font-medium mb-3">{axisLabel}</p>
          <div className="flex gap-4 justify-center mb-3">
            <button
              type="button"
              onClick={() => setAxis(key, true)}
              className={`flex-1 py-4 rounded-xl text-2xl transition ${values[key] === true ? 'bg-green-500 text-white shadow' : 'bg-slate-100 text-slate-400'}`}
            >
              😊 Positif
            </button>
            <button
              type="button"
              onClick={() => setAxis(key, false)}
              className={`flex-1 py-4 rounded-xl text-2xl transition ${values[key] === false ? 'bg-red-500 text-white shadow' : 'bg-slate-100 text-slate-400'}`}
            >
              😢 Difficulté
            </button>
          </div>
          <input
            type="text"
            placeholder="Note (optionnelle)"
            value={notes[key] || ''}
            onChange={(e) => setNote(key, e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-200 text-sm"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || sending}
        className="w-full py-5 rounded-2xl bg-slate-800 text-white text-lg font-bold shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-6"
      >
        {sending ? 'Envoi…' : 'Envoyer l\'observation'}
      </button>
    </div>
  );
}
