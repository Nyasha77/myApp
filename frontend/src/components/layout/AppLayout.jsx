import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <MobileHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
