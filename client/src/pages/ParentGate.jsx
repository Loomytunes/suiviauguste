import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyParentPassword } from '../api';

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
    <div className="min-h-dvh bg-slate-100 p-6 flex flex-col justify-center">
      <button type="button" onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-white shadow text-slate-700">←</button>
      <h1 className="text-xl font-bold text-slate-800 text-center mb-2">Vue Parent</h1>
      <p className="text-slate-600 text-center text-sm mb-6">Mot de passe requis</p>
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto w-full">
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Mot de passe"
          className="w-full p-4 rounded-xl border border-slate-200 text-lg mb-4"
          autoFocus
        />
        {error && <p className="text-red-600 text-sm mb-2">Mot de passe incorrect</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 rounded-2xl bg-parent text-white text-lg font-bold shadow disabled:opacity-70"
        >
          {loading ? 'Vérification…' : 'Accéder'}
        </button>
      </form>
    </div>
  );
}
