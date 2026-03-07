import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function ExpandableNote({ value, onChange, placeholder = 'Note (optionnelle)' }) {
  const [open, setOpen] = useState(!!value);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
      >
        {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        {open ? 'Masquer la note' : 'Ajouter une note'}
      </button>
      {open && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full p-3 rounded-xl border border-slate-200 text-sm bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-300 outline-none transition-all"
        />
      )}
    </div>
  );
}
