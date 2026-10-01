import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SLOW_HOST_HINT_MS = 4000;

export default function Login() {
  const { user, login, error } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSlowHint, setShowSlowHint] = useState(false);
  const slowHintTimer = useRef(null);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setShowSlowHint(false);
    // Render's free tier fully sleeps after inactivity - the first request can
    // take 50s+ to wake it. Only surface that explanation once it's actually
    // taking a while, so a normal fast login never shows it.
    slowHintTimer.current = setTimeout(() => setShowSlowHint(true), SLOW_HOST_HINT_MS);
    await login(identifier, password);
    clearTimeout(slowHintTimer.current);
    setShowSlowHint(false);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mb-3">
            <Swords className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Ascend</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue your progress</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label" htmlFor="identifier">Username or email</label>
            <input
              id="identifier"
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {showSlowHint && (
            <p className="text-sm text-slate-500">
              Still working &mdash; the server sleeps when idle and can take up to a minute to wake up on its first
              request.
            </p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
