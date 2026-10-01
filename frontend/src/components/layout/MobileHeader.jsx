import { Link, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';

const TITLES = {
  '/': 'Dashboard',
  '/tasks': 'Tasks',
  '/gym': 'Gym',
  '/calendar': 'Calendar',
  '/statistics': 'Statistics',
  '/progression': 'Progression',
  '/categories': 'Categories',
  '/settings': 'Settings',
};

export default function MobileHeader() {
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Ascend';

  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 bg-surface/90 backdrop-blur border-b border-surface-border"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
    >
      <p className="font-semibold text-slate-100">{title}</p>
      <Link
        to="/settings"
        aria-label="Settings"
        className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-raised"
      >
        <SettingsIcon className="w-5 h-5" />
      </Link>
    </header>
  );
}
