import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sun, Moon, Monitor, LogOut, Shapes, ChevronRight, Activity, RefreshCw, Unlink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import * as authApi from '../api/auth';
import * as stravaApi from '../api/strava';

const IS_LOCALHOST = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const THEME_OPTIONS = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [strava, setStrava] = useState(null);
  const [stravaBusy, setStravaBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    authApi.me().then(setProfile).catch(() => {});
  }, []);

  const loadStrava = useCallback(() => {
    stravaApi.getStravaStatus().then(setStrava).catch(() => {});
  }, []);

  useEffect(() => {
    loadStrava();
  }, [loadStrava]);

  useEffect(() => {
    const result = searchParams.get('strava');
    if (!result) return;
    if (result === 'connected') toast.info('Strava connected');
    else if (result === 'denied') toast.error('Strava connection was cancelled');
    else if (result === 'error') toast.error('Strava connection failed - try again');
    setSearchParams({}, { replace: true });
    loadStrava();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSyncNow = async () => {
    setStravaBusy(true);
    try {
      const result = await stravaApi.syncStrava();
      if (result.newRuns?.length) toast.info(`${result.newRuns.length} new run(s) synced from Strava`);
      else toast.info('No new runs on Strava');
      loadStrava();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sync failed');
    } finally {
      setStravaBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setStravaBusy(true);
    try {
      await stravaApi.disconnectStrava();
      loadStrava();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not disconnect');
    } finally {
      setStravaBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-bold text-slate-50">Settings</h1>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-100 mb-3">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Username</span>
            <span className="text-slate-200">{profile?.username || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-200">{profile?.email || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Timezone</span>
            <span className="text-slate-200">{profile?.timezone || '—'}</span>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-100 mb-3">Appearance</h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors ${
                theme === key ? 'border-accent bg-accent/10 text-accent' : 'border-surface-border text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <Link to="/categories" className="flex items-center gap-3 p-5 hover:bg-surface-raised transition-colors md:hidden">
          <div className="w-9 h-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <Shapes className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-100">Categories</p>
            <p className="text-xs text-slate-500">Manage the areas quests grow your stats in</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </Link>
      </section>

      <section className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100">Strava</h2>
            <p className="text-xs text-slate-500">Sync runs in, post gym sessions out</p>
          </div>
        </div>

        {strava?.connected ? (
          <div className="space-y-3">
            <div className="text-sm text-slate-400">
              Connected
              {strava.lastSyncedAt && (
                <> &middot; last synced {new Date(strava.lastSyncedAt).toLocaleString()}</>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSyncNow} disabled={stravaBusy} className="btn-secondary flex-1">
                <RefreshCw className="w-4 h-4" /> Sync now
              </button>
              <button type="button" onClick={handleDisconnect} disabled={stravaBusy} className="btn-secondary text-red-400">
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : IS_LOCALHOST ? (
          <a href={stravaApi.connectStravaUrl()} className="btn-primary w-full">
            Connect Strava
          </a>
        ) : (
          <p className="text-sm text-slate-500">
            Open this app at <span className="text-slate-300">http://localhost:5173</span> on this computer to connect
            Strava &mdash; its login can&apos;t be completed from a phone/LAN address.
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-100 mb-2">Gamification</h2>
        <p className="text-sm text-slate-500">
          XP, leveling, decay, and streak rules are centrally configured. Categories determine which stats grow when
          you complete a quest &mdash; manage those from the Categories page.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-100 mb-2">Data</h2>
        <p className="text-sm text-slate-500">Export and import tools are coming in a future update.</p>
      </section>

      <button type="button" onClick={logout} className="btn-secondary w-full text-red-400">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}
