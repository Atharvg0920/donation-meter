import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getAdminKey, setAdminKey } from '../lib/api.js';
import { fmtDate, fmtTime, inr } from '../lib/format.js';
import AdminShell, { btn, btnGhost, btnPrimary } from '../components/AdminShell.jsx';

function Login({ onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      await api.login(password);
      setAdminKey(password);
      onDone();
    } catch (err) { setError(err.message); }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold">Admin login</h1>
        <p className="mb-5 text-sm text-slate-500">Demo password is in server/.env (default: admin123)</p>
        <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2" />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button className={`${btnPrimary} w-full justify-center`}>Sign in</button>
      </form>
    </div>
  );
}

const stateColor = { active: 'bg-green-100 text-green-700', paused: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700', upcoming: 'bg-blue-100 text-blue-700' };

export default function Dashboard() {
  const [authed, setAuthed] = useState(!!getAdminKey());
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authed) return;
    const load = () =>
      Promise.all([api.stats(), api.campaigns()])
        .then(([s, c]) => { setStats(s); setCampaigns(c); })
        .catch((e) => { if (e.status === 401) { setAdminKey(''); setAuthed(false); } else setError(e.message); });
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [authed]);

  async function handleDelete(c) {
    if (!window.confirm(`Delete "${c.title}" and all its contributions? This cannot be undone.`)) return;
    try {
      await api.deleteCampaign(c._id);
      setCampaigns((prev) => prev?.filter((x) => x._id !== c._id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const cards = stats && [
    ['Total campaigns', stats.totalCampaigns],
    ['Active campaigns', stats.activeCampaigns],
    ['Total collected', inr(stats.totalCollected)],
    ['Total contributors', stats.totalContributors],
  ];

  return (
    <AdminShell title="Dashboard" actions={<Link to="/admin/campaigns/new" className={btnPrimary}>+ Create campaign</Link>}>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(cards || [
          ['Total campaigns', '…'],
          ['Active campaigns', '…'],
          ['Total collected', '…'],
          ['Total contributors', '…'],
        ]).map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-extrabold">{cards ? value : '…'}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Campaigns</h2>
      {campaigns && campaigns.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
          No campaigns yet. Create your first one.
        </div>
      )}
      <div className="mb-8 space-y-3">
        {campaigns?.map((c) => (
          <div key={c._id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">{c.name}</div>
                <Link to={`/admin/campaigns/${c._id}`} className="text-lg font-bold hover:underline">{c.title}</Link>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${stateColor[c.state]}`}>{c.state}</span>
              </div>
              <div className="text-right text-sm">
                <div><b>{inr(c.totalCollected)}</b> of {inr(c.targetAmount)}</div>
                <div className="text-slate-500">{inr(c.remainingAmount)} remaining</div>
              </div>
            </div>
            <div className="my-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${c.progressPercentage}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={btnGhost} to={`/admin/campaigns/${c._id}`}>View / History</Link>
              <Link className={btnGhost} to={`/admin/campaigns/${c._id}/edit`}>Edit</Link>
              <a className={btnGhost} href={`/display/${c._id}`} target="_blank" rel="noreferrer">Open display</a>
              <a className={btnGhost} href={`/donate/${c._id}`} target="_blank" rel="noreferrer">Donation page</a>
              <Link className={btnGhost} to={`/admin/campaigns/${c._id}/qr`}>QR code</Link>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                className={`${btn} bg-red-600 text-white hover:bg-red-700`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Recent contributions</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr>
            <th className="p-3">Contributor</th><th className="p-3">Amount</th><th className="p-3">Date</th><th className="p-3">Message</th>
          </tr></thead>
          <tbody>
            {stats?.recent.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-3 font-medium">{r.contributorName}</td>
                <td className="p-3">{inr(r.amount)}</td>
                <td className="p-3">{fmtDate(r.createdAt)} {fmtTime(r.createdAt)}</td>
                <td className="p-3">{r.message || '—'}</td>
              </tr>
            ))}
            {stats && stats.recent.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No contributions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
