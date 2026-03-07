import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({ to, onClick, className = '' }) {
  const navigate = useNavigate();
  const handleClick = () => (onClick ? onClick() : to ? navigate(to) : navigate(-1));

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Retour"
      className={`
        inline-flex items-center justify-center w-12 h-12 rounded-2xl
        bg-white/90 shadow-soft text-slate-600
        active:scale-95 transition-transform duration-150
        hover:bg-white hover:text-slate-800
        ${className}
      `}
    >
      <ArrowLeftIcon className="w-6 h-6" />
    </button>
  );
}
