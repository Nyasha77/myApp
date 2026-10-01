import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Dumbbell, CalendarDays, BarChart3, Sparkles } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/gym', label: 'Gym', icon: Dumbbell },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/statistics', label: 'Stats', icon: BarChart3 },
  { to: '/progression', label: 'Progress', icon: Sparkles },
];

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur border-t border-surface-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-xs font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
