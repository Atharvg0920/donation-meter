import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { fmtDate, fmtTime, inr } from '../lib/format.js';
import { useLiveCampaign } from '../hooks/useLiveCampaign.js';
import AdminShell, { btnGhost, btnPrimary } from '../components/AdminShell.jsx';

const statusStyle = { successful: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700' };

export default function CampaignDetail() {
  const { id } = useParams();
  const { campaign: c, error } = useLiveCampaign(id);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const loadRows = () => api.contributions(id).then(setRows).catch((e) => setNote(e.message));
  useEffect(() => { loadRows(); }, [id, c?.totalCollected]);

  // Runs the exact same two-step flow a donor goes through, so you can demo without a phone.
  async function demoContribution() {
    setBusy(true); setNote('');
    try {
      const names = [['Rahul Sharma', 2000, 'Jai Shree Ram'], ['Priya Verma', 1000, ''], ['Amit Patel', 500, 'Seva']];
      const [name, amount, message] = names[(c?.contributorCount || 0) % names.length];
      const intent = await api.createIntent(id, { contributorName: name, amount, message });
      await api.confirmPayment(id, { contributionId: intent.contributionId });
    } catch (e) { setNote(e.message); }
    setBusy(false);
  }

  async function reset() {
    if (!confirm('Delete all contributions for this campaign and reset to ₹0?')) return;
    await api.resetCampaign(id);
    loadRows();
  }

  if (error) return <AdminShell title="Campaign"><p className="text-red-600">{error}</p></AdminShell>;
  if (!c) return <AdminShell title="Loading…"><p>Loading…</p></AdminShell>;

  return (
    <AdminShell
      title={`${c.name} — ${c.title}`}
      actions={<>
        <a className={btnGhost} href={`/display/${id}`} target="_blank" rel="noreferrer">Open display</a>
        <a className={btnGhost} href={`/donate/${id}`} target="_blank" rel="noreferrer">Donation page</a>
        <Link className={btnGhost} to={`/admin/campaigns/${id}/qr`}>QR code</Link>
        <Link className={btnGhost} to={`/admin/campaigns/${id}/edit`}>Edit</Link>
      </>}
    >
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Target', inr(c.targetAmount)], ['Collected', inr(c.totalCollected)], ['Remaining', inr(c.remainingAmount)], ['Progress', `${c.progressPercentage}%`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{l}</div><div className="text-2xl font-extrabold">{v}</div></div>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 p-4">
        <span className="mr-2 text-sm text-amber-900">Demo tools:</span>
        <button disabled={busy} onClick={demoContribution} className={btnPrimary}>{busy ? 'Processing…' : 'Add demo contribution'}</button>
        <button onClick={reset} className={btnGhost}>Reset campaign</button>
        {note && <span className="text-sm text-red-600">{note}</span>}
      </div>

      <h2 className="mb-3 text-lg font-bold">Contribution history</h2>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600"><tr>
            {['Contributor', 'Amount', 'Date', 'Time', 'Message', 'Status', 'Transaction ID'].map((h) => <th key={h} className="p-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-3 font-medium">{r.contributorName}</td>
                <td className="p-3">{inr(r.amount)}</td>
                <td className="p-3">{fmtDate(r.createdAt)}</td>
                <td className="p-3">{fmtTime(r.createdAt)}</td>
                <td className="p-3">{r.message || '—'}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[r.paymentStatus]}`}>{r.paymentStatus}</span></td>
                <td className="p-3 font-mono text-xs">{r.transactionId}</td>
              </tr>
            ))}
            {rows && rows.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-500">No contributions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
