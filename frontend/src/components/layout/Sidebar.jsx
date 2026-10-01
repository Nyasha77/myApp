import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Dumbbell, CalendarDays, BarChart3, Sparkles, Shapes, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/gym', label: 'Gym', icon: Dumbbell },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/progression', label: 'Progression', icon: Sparkles },
  { to: '/categories', label: 'Categories', icon: Shapes },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 border-r border-surface-border bg-surface-raised/60 h-screen sticky top-0">
      <div className="px-5 py-6">
        <p className="text-lg font-bold tracking-tight text-slate-50">Ascend</p>
        <p className="text-xs text-slate-500 mt-0.5">{user?.username}</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-accent/15 text-accent' : 'text-slate-400 hover:text-slate-100 hover:bg-surface-card'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-surface-border">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-surface-card transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
