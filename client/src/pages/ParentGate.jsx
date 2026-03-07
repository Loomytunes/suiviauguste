import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyParentPassword } from '../api';
import BackButton from '../components/BackButton';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function ParentGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    try {
      const valid = await verifyParentPassword(password);
      if (valid) navigate('/parent/dashboard', { replace: true });
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center p-6 app-page">
      <div className="absolute top-4 left-4">
        <BackButton onClick={() => navigate(-1)} />
      </div>

      <div className="max-w-sm mx-auto w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <LockClosedIcon className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Vue Parent</h1>
        <p className="text-slate-500 text-sm mt-1 mb-6">Mot de passe requis</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Mot de passe"
            className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white text-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm font-medium">Mot de passe incorrect</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-slate-700 text-white text-lg font-bold shadow-card active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification…
              </>
            ) : (
              'Accéder'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
