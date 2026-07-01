import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSessionFromToken } = useAuth();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const token = searchParams.get('accessToken');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setSessionFromToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, [searchParams, navigate, setSessionFromToken]);

  return <div className="flex h-screen items-center justify-center text-slate-500">Signing you in…</div>;
}
