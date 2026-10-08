import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import AdminShell, { btnGhost, btnPrimary } from '../components/AdminShell.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const inYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); };
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2';

export default function CampaignForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: '', title: '', description: '', targetAmount: 10000, location: '', upiId: '',
    logo: '', startDate: today(), endDate: inYear(), status: 'active',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!id) return;
    api.campaigns().then((list) => {
      const c = list.find((x) => x._id === id);
      if (c) setF({ ...c, startDate: c.startDate.slice(0, 10), endDate: c.endDate.slice(0, 10) });
    });
  }, [id]);

  function onLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 400 * 1024) return setError('Logo must be under 400 KB');
    const reader = new FileReader();
    reader.onload = () => setF((p) => ({ ...p, logo: reader.result }));
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = { ...f, targetAmount: Number(f.targetAmount) };
      const saved = id ? await api.updateCampaign(id, body) : await api.createCampaign(body);
      nav(`/admin/campaigns/${saved._id}`);
    } catch (err) { setError(err.message); setSaving(false); }
  }

  return (
    <AdminShell title={id ? 'Edit campaign' : 'Create campaign'}>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label>Organization name *<input required className={input} value={f.name} onChange={set('name')} placeholder="Shree Ram Mandir" /></label>
        <label>Campaign title *<input required className={input} value={f.title} onChange={set('title')} placeholder="Temple Renovation Fund" /></label>
        <label className="md:col-span-2">Description<textarea rows="3" className={input} value={f.description} onChange={set('description')} /></label>
        <label>Target amount (₹) *<input required type="number" min="1" className={input} value={f.targetAmount} onChange={set('targetAmount')} /></label>
        <label>UPI ID<input className={input} value={f.upiId} onChange={set('upiId')} placeholder="temple@upi" /></label>
        <label>Location<input className={input} value={f.location} onChange={set('location')} /></label>
        <label>Logo (max 400 KB)<input type="file" accept="image/*" onChange={onLogo} className={input} /></label>
        <label>Start date *<input required type="date" className={input} value={f.startDate} onChange={set('startDate')} /></label>
        <label>End date *<input required type="date" className={input} value={f.endDate} onChange={set('endDate')} /></label>
        {id && (
          <label>Status
            <select className={input} value={f.status} onChange={set('status')}><option value="active">Active</option><option value="paused">Paused</option></select>
          </label>
        )}
        {f.logo && <img src={f.logo} alt="logo" className="h-16 w-16 rounded-lg object-cover" />}
        {error && <p className="text-red-600 md:col-span-2">{error}</p>}
        <div className="flex gap-2 md:col-span-2">
          <button disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : id ? 'Save changes' : 'Create campaign'}</button>
          <button type="button" className={btnGhost} onClick={() => nav('/admin')}>Cancel</button>
        </div>
      </form>
    </AdminShell>
  );
}
