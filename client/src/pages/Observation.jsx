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

  const filledCount = [values.concentration, values.respect_consigne, values.emotion_management, values.respect_peers].filter(
    (v) => v !== null && v !== undefined
  ).length;
  const canSubmit = filledCount >= 1;

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
        <h1 className="text-xl font-bold text-slate-800 truncate flex-1">{label}</h1>
        <span className="text-slate-500 text-sm font-medium shrink-0">{filledCount} axe{filledCount > 1 ? 's' : ''}</span>
      </header>

      <main className="flex-1 p-4 space-y-3 overflow-y-auto">
        {AXES.map(({ key, label: axisLabel }) => (
          <div
            key={key}
            className="bg-white rounded-2xl p-4 shadow-card border border-slate-100"
          >
            <p className="text-slate-700 font-semibold mb-3 text-sm">{axisLabel}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAxis(key, true); }}
                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-150 select-none touch-manipulation ${
                  values[key] === true
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 active:bg-green-100'
                }`}
              >
                <span className="text-3xl leading-none">🙂</span>
                <span className="text-xs font-medium mt-1">Positif</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAxis(key, false); }}
                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-150 select-none touch-manipulation ${
                  values[key] === false
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 active:bg-red-100'
                }`}
              >
                <span className="text-3xl leading-none">🙁</span>
                <span className="text-xs font-medium mt-1">Difficulté</span>
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

      {!canSubmit && (
        <p className="px-4 py-1 text-center text-slate-500 text-sm">Choisissez au moins un axe pour envoyer</p>
      )}
      <StickySubmit onClick={handleSubmit} disabled={!canSubmit} loading={sending}>
        Envoyer l&apos;observation
      </StickySubmit>
    </div>
  );
}
