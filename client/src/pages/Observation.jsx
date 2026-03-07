import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitObservation, addPendingObservation } from '../api';
import { LOCATION_LABELS, AXES } from '../lib/constants';
import BackButton from '../components/BackButton';
import ExpandableNote from '../components/ExpandableNote';
import StickySubmit from '../components/StickySubmit';

export default function Observation() {
  const { location } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    concentration: null,
    respect_consigne: null,
    emotion_management: null,
    respect_peers: null
  });
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
    staff_email: '',
    concentration: values.concentration === true ? 1 : 0,
    respect_consigne: values.respect_consigne === true ? 1 : 0,
    emotion_management: values.emotion_management === true ? 1 : 0,
    respect_peers: values.respect_peers === true ? 1 : 0,
    notes: Object.values(notes).filter(Boolean).join(' | ') || null
  };

  const canSubmit =
    values.concentration !== null &&
    values.respect_consigne !== null &&
    values.emotion_management !== null &&
    values.respect_peers !== null;

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

  const label = LOCATION_LABELS[location] || location;

  return (
    <div className="min-h-dvh flex flex-col app-page pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80">
        <BackButton onClick={() => navigate(-1)} />
        <h1 className="text-xl font-bold text-slate-800 truncate">{label}</h1>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {AXES.map(({ key, label: axisLabel }) => (
          <div
            key={key}
            className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 animate-slide-up"
          >
            <p className="text-slate-700 font-semibold mb-4 text-base">{axisLabel}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAxis(key, true)}
                className={`flex-1 flex flex-col items-center justify-center py-5 rounded-2xl transition-all duration-200 active:animate-tap ${
                  values[key] === true
                    ? 'bg-green-500 text-white shadow-lg scale-[1.02]'
                    : 'bg-slate-100 text-slate-400 hover:bg-green-50'
                }`}
              >
                <span className="text-4xl mb-1">🙂</span>
                <span className="text-sm font-medium">Positif</span>
              </button>
              <button
                type="button"
                onClick={() => setAxis(key, false)}
                className={`flex-1 flex flex-col items-center justify-center py-5 rounded-2xl transition-all duration-200 active:animate-tap ${
                  values[key] === false
                    ? 'bg-red-500 text-white shadow-lg scale-[1.02]'
                    : 'bg-slate-100 text-slate-400 hover:bg-red-50'
                }`}
              >
                <span className="text-4xl mb-1">🙁</span>
                <span className="text-sm font-medium">Difficulté</span>
              </button>
            </div>
            <ExpandableNote
              value={notes[key] || ''}
              onChange={(v) => setNote(key, v)}
              placeholder="Note (optionnelle)"
            />
          </div>
        ))}
      </main>

      <StickySubmit onClick={handleSubmit} disabled={!canSubmit} loading={sending}>
        Envoyer l&apos;observation
      </StickySubmit>
    </div>
  );
}
