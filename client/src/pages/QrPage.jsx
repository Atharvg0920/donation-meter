import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useLiveCampaign } from '../hooks/useLiveCampaign.js';
import { inr } from '../lib/format.js';
import { btnGhost, btnPrimary } from '../components/AdminShell.jsx';

export default function QrPage() {
  const { id } = useParams();
  const { campaign: c, error } = useLiveCampaign(id);
  const ref = useRef(null);

  function download() {
    const a = document.createElement('a');
    a.href = ref.current.querySelector('canvas').toDataURL('image/png');
    a.download = `qr-${id}.png`;
    a.click();
  }

  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (!c) return <p className="p-10 text-center">Loading…</p>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-6 text-white">
      <h1 className="text-center text-3xl font-extrabold">{c.name}</h1>
      <p className="mb-6 text-center text-slate-300">{c.title}</p>
      <div ref={ref} className="rounded-3xl bg-white p-6">
        <QRCodeCanvas value={c.donateUrl} size={320} level="H" includeMargin />
      </div>
      <p className="mt-6 text-3xl font-black tracking-widest text-amber-400">SCAN TO CONTRIBUTE</p>
      <p className="mt-1 break-all text-center text-sm text-slate-400">{c.donateUrl}</p>
      <div className="mt-6 flex gap-8 text-center">
        <div><div className="text-sm text-slate-400">Target</div><div className="text-2xl font-bold">{inr(c.targetAmount)}</div></div>
        <div><div className="text-sm text-slate-400">Collected</div><div className="text-2xl font-bold">{inr(c.totalCollected)}</div></div>
        <div><div className="text-sm text-slate-400">Remaining</div><div className="text-2xl font-bold">{inr(c.remainingAmount)}</div></div>
      </div>
      <div className="mt-8 flex gap-2">
        <button onClick={download} className={btnPrimary}>Download QR code</button>
        <Link to="/admin" className={btnGhost + ' !text-slate-900'}>Back</Link>
      </div>
    </div>
  );
}
