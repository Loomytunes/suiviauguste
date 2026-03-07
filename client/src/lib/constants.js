export const LOCATIONS = [
  { id: 'bus', label: 'Bus', color: 'bus', icon: 'Bus', to: '/obs/bus' },
  { id: 'cantine', label: 'Cantine', color: 'cantine', icon: 'Cake', to: '/obs/cantine' },
  { id: 'garderie', label: 'Garderie', color: 'garderie', icon: 'BuildingOffice2', to: '/obs/garderie' },
  { id: 'recreation', label: 'Récréation', color: 'recreation', icon: 'Sparkles', to: '/obs/recreation' },
  { id: 'classe', label: 'Classe', color: 'classe', icon: 'AcademicCap', to: '/obs/classe' }
];

export const LOCATION_LABELS = Object.fromEntries(LOCATIONS.map((l) => [l.id, l.label]));

export const AXES = [
  { key: 'concentration', label: 'Concentration / Agitation', short: 'Conc.' },
  { key: 'respect_consigne', label: 'Respect des consignes et de l\'adulte', short: 'Cons.' },
  { key: 'emotion_management', label: 'Gestion des émotions', short: 'Émot.' },
  { key: 'respect_peers', label: 'Respect de mes camarades', short: 'Cam.' }
];

export const AXIS_LABELS = Object.fromEntries(AXES.map((a) => [a.key, a.label]));
export const AXIS_SHORT = Object.fromEntries(AXES.map((a) => [a.key, a.short]));

export const CHART_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#22c55e', '#6366f1'];
