import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import LocationBadge from './LocationBadge';
import { LOCATION_LABELS, AXES } from '../lib/constants';

const AxisIcon = ({ value }) => (
  <span className="text-lg" title={value === 1 ? 'Positif' : 'Difficulté'}>
    {value === 1 ? '🙂' : '🙁'}
  </span>
);

export default function ObservationTimelineCard({ obs }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const hasNotes = !!obs.notes;

  return (
    <article className="bg-white rounded-2xl p-4 shadow-card border border-slate-100 overflow-hidden">
      <div className="flex justify-between items-start gap-2">
        <LocationBadge location={obs.location} label={LOCATION_LABELS[obs.location] || obs.location} />
        <time className="text-slate-500 text-sm shrink-0">
          {obs.date} · {obs.time}
        </time>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {AXES.map(({ key, short }) => {
          const val = obs[key];
          if (val !== 0 && val !== 1) return null;
          return (
            <span
              key={key}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                val === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <AxisIcon value={val} /> {short}
            </span>
          );
        })}
      </div>
      {hasNotes && (
        <>
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            className="mt-3 flex items-center gap-1 text-slate-500 text-sm font-medium hover:text-slate-700"
          >
            {notesOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            {notesOpen ? 'Masquer la note' : 'Voir la note'}
          </button>
          {notesOpen && <p className="mt-2 text-slate-600 text-sm bg-slate-50 rounded-xl p-3">{obs.notes}</p>}
        </>
      )}
    </article>
  );
}
