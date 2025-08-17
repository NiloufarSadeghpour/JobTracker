// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { tokenStore } from '../utils/axios';
import { useEffect, useState } from 'react';
import axios from '../utils/axios';

export default function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // If we already have an access token in memory, allow immediately
      if (tokenStore.get()) {
        if (mounted) { setAuthed(true); setReady(true); }
        return;
      }
      // Try to refresh once (cookie-based)
      try {
        const { data } = await axios.post('/auth/refresh');
        tokenStore.set(data.accessToken);
        if (mounted) { setAuthed(true); }
      } catch {
        if (mounted) { setAuthed(false); }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!ready) return null; // or a spinner
  return authed ? children : <Navigate to="/auth" replace />;
}
