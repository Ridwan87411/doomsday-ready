import { NavLink, Outlet } from 'react-router-dom';
import { Clapperboard, Ticket, ListChecks, Command, GitBranch, Menu, X, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { USE_DEMO_DATA } from '../services/api';
import { mockBackend } from '../services/mockBackend';

const links = [
  { to: '/', label: 'Movies', icon: Clapperboard },
  { to: '/rewatch-plan', label: 'Rewatch plan', icon: ListChecks },
  { to: '/booking', label: 'Watch party', icon: Ticket },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { movies, loading, loadError, reload } = useData();

  async function resetDemo() {
    if (!window.confirm('Reset all demo data back to the sample movies and cinemas?')) return;
    await mockBackend.reset();
    await reload();
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Command size={22} /></div>
          <div>
            <strong>DOOMSDAY<span>.</span></strong>
            <small>READY PROJECT</small>
          </div>
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === '/' && <span className="nav-count">{String(movies.length).padStart(2, '0')}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-promo">
            <div className="promo-icon"><Clapperboard size={18} /></div>
            <strong>Your MCU marathon starts here.</strong>
            <p>Get ready before the next big event.</p>
          </div>
          {USE_DEMO_DATA && (
            <button className="github-link reset-link" onClick={resetDemo}>
              <RotateCcw size={16} /> Reset demo data
            </button>
          )}
          <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer">
            <GitBranch size={16} /> Project repository <span>↗</span>
          </a>
        </div>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <div className="breadcrumb">YOUR UNIVERSE <span>/</span> <b>DOOMSDAY READY</b></div>
          <div className="topbar-right">
            <span className="live-dot" /> {USE_DEMO_DATA ? 'DEMO MODE' : 'LIVE API'}
            <div className="avatar">R</div>
          </div>
        </header>
        <div className="page-content">
          {loadError ? (
            <div className="empty-state">
              <h3>Could not load data</h3>
              <p>{loadError}</p>
              <button className="btn btn-primary retry-btn" onClick={reload}>Try again</button>
            </div>
          ) : loading && movies.length === 0 ? (
            <div className="empty-state"><h3>Loading…</h3></div>
          ) : (
            <Outlet />
          )}
        </div>
        <footer className="footer">
          BUILT FOR THE FANS <span>•</span> DOOMSDAY READY <span className="footer-right">FRONTEND 1.1</span>
        </footer>
      </main>
    </div>
  );
}
