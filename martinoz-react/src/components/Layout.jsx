import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useDatabase } from '../context/DatabaseContext';

export default function Layout() {
  const { isSidebarOpen, setSidebarOpen } = useDatabase();

  return (
    <>
      {/* Ambient glowing mesh background spheres */}
      <div className="ambient-glow">
        <div className="glow-bubble gb-1"></div>
        <div className="glow-bubble gb-2"></div>
        <div className="glow-bubble gb-3"></div>
      </div>

      <Sidebar />

      {/* Backdrop for closing mobile sidebar drawer */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      <main className="main-viewport">
        <Outlet />
      </main>
    </>
  );
}
