import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="app-shell">
      <div className="phone-frame">
        <div className="atmosphere" aria-hidden />
        <main className="app-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
