import { Link, useNavigate } from 'react-router-dom';
import { setAdminKey } from '../lib/api.js';

export default function AdminShell({ children, title, actions }) {
  const nav = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="text-lg font-bold">🪔 Digital Donation Meter</Link>
          <button
            onClick={() => { setAdminKey(''); nav('/admin'); window.location.reload(); }}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >Logout</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        {children}
      </main>
    </div>
  );
}

export const btn = 'inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50';
export const btnPrimary = `${btn} bg-orange-500 text-white hover:bg-orange-600`;
export const btnGhost = `${btn} border border-slate-300 bg-white hover:bg-slate-100`;
