import { Link } from 'react-router-dom';
import * as Heroicons from '@heroicons/react/24/solid';

const iconMap = {
  Bus: Heroicons.TruckIcon,
  Cake: Heroicons.CakeIcon,
  BuildingOffice2: Heroicons.BuildingOffice2Icon,
  Sparkles: Heroicons.SparklesIcon,
  AcademicCap: Heroicons.AcademicCapIcon,
  Eye: Heroicons.EyeIcon
};

export default function ContextCard({ to, label, color, iconName, isParent }) {
  const Icon = iconMap[iconName] || Heroicons.SparklesIcon;

  const baseClasses = `
    flex items-center gap-4 rounded-3xl p-5 min-h-[80px]
    shadow-card transition-all duration-300 ease-out
    active:scale-[0.98] active:shadow-soft
    hover:shadow-card-hover
  `;

  const colorMap = {
    bus: 'bg-gradient-to-br from-bus to-bus-light text-white',
    cantine: 'bg-gradient-to-br from-cantine to-cantine-light text-white',
    garderie: 'bg-gradient-to-br from-garderie to-garderie-light text-white',
    recreation: 'bg-gradient-to-br from-recreation to-recreation-light text-white',
    classe: 'bg-gradient-to-br from-classe to-classe-light text-white'
  };
  const colorClasses = isParent
    ? 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
    : (colorMap[color] || colorMap.classe);

  const content = (
    <>
      <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 shrink-0">
        <Icon className="w-8 h-8" />
      </span>
      <span className="text-lg font-semibold">{label}</span>
    </>
  );

  const className = `${baseClasses} ${colorClasses}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
