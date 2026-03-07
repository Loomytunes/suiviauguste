import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Observation from './pages/Observation';
import ParentGate from './pages/ParentGate';
import ParentView from './pages/ParentView';
import { getPendingObservations, syncObservations, setPendingObservations } from './api';

export default function App() {
  useEffect(() => {
    const onOnline = () => {
      const pending = getPendingObservations();
      if (pending.length) {
        syncObservations(pending).then(() => setPendingObservations([])).catch(() => {});
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/obs/:location" element={<Observation />} />
      <Route path="/parent" element={<ParentGate />} />
      <Route path="/parent/dashboard" element={<ParentView />} />
    </Routes>
  );
}
