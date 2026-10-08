import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { inr } from '../lib/format.js';
import { useLiveCampaign } from '../hooks/useLiveCampaign.js';

const QUICK = [100, 500, 1000, 2000];

// Steps: form -> pay (demo payment sheet) -> processing -> success | failed
export default function DonatePage() {
  const { id } = useParams();
  const { campaign: c, error } = useLiveCampaign(id);
  const [form, setForm] = useState({ contributorName: '', amount: '', message: '' });
  const [step, setStep] = useState('form');
  const [intent, setIntent] = useState(null);
  const [msg, setMsg] = useState('');

  if (error) return <Shell><p className="text-center text-red-600">{error}</p></Shell>;
  if (!c) return <Shell><p className="text-center">Loading…</p></Shell>;

  const closed = c.state !== 'active';
  const amount = Number(form.amount);

  async function startPayment(e) {
    e.preventDefault();
    setMsg('');
    if (!form.contributorName.trim()) return setMsg('Please enter your name');
    if (!Number.isInteger(amount) || amount <= 0) return setMsg('Enter a valid amount greater than ₹0');
    try {
      setIntent(await api.createIntent(id, { ...form, amount }));
      setStep('pay');
    } catch (err) { setMsg(err.message); }
  }

  async function pay(simulate) {
    setStep('processing');
    await new Promise((r) => setTimeout(r, 1500)); // fake gateway latency
    try {
      await api.confirmPayment(id, { contributionId: intent.contributionId, simulate });
      setStep('success');
    } catch (err) { setMsg(err.message); setStep('failed'); }
  }

  const reset = () => { setStep('form'); setIntent(null); setMsg(''); setForm({ contributorName: '', amount: '', message: '' }); };

  return (
    <Shell>
      <div className="mb-4 text-center">
        {c.logo && <img src={c.logo} alt="" className="mx-auto mb-2 h-16 w-16 rounded-xl object-cover" />}
        <div className="text-xs font-semibold uppercase tracking-widest text-orange-600">{c.name}</div>
        <h1 className="text-xl font-extrabold">{c.title}</h1>
        {c.description && <p className="mt-1 text-sm text-slate-600">{c.description}</p>}
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${c.progressPercentage}%` }} />
        </div>
        <div className="grid grid-cols-3 text-center text-sm">
          <div><div className="text-slate-500">Target</div><b>{inr(c.targetAmount)}</b></div>
          <div><div className="text-slate-500">Collected</div><b className="text-emerald-600">{inr(c.totalCollected)}</b></div>
          <div><div className="text-slate-500">Remaining</div><b className="text-orange-600">{inr(c.remainingAmount)}</b></div>
        </div>
        {c.goalAchieved && <p className="mt-3 text-center font-bold text-emerald-600">GOAL ACHIEVED 🎉 — you can still contribute!</p>}
      </div>

      {closed && <p className="rounded-xl bg-red-50 p-4 text-center font-semibold text-red-700">This campaign is {c.state} and not accepting contributions.</p>}

      {!closed && step === 'form' && (
        <form onSubmit={startPayment} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium">Contribution amount (₹)
            <input inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, '') })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-xl font-bold" placeholder="2000" />
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button type="button" key={q} onClick={() => setForm({ ...form, amount: String(q) })} className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-orange-50">{inr(q)}</button>
            ))}
          </div>
          <label className="block text-sm font-medium">Your name
            <input value={form.contributorName} maxLength={60} onChange={(e) => setForm({ ...form, contributorName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3" placeholder="Rahul Sharma" />
          </label>
          <label className="block text-sm font-medium">Message (optional)
            <input value={form.message} maxLength={200} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3" placeholder="Jai Shree Ram" />
          </label>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button className="w-full rounded-xl bg-orange-500 py-3.5 text-lg font-bold text-white active:scale-[0.98]">
            Contribute {amount > 0 ? inr(amount) : ''}
          </button>
        </form>
      )}

      {step === 'pay' && intent && (
        <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-5 text-center">
          <div className="mb-1 inline-block rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold">DEMO PAYMENT</div>
          <p className="text-sm text-amber-900">No real money is charged. This simulates a payment gateway.</p>
          <div className="my-3 text-3xl font-black">{inr(intent.amount)}</div>
          <p className="mb-4 font-mono text-xs text-slate-500">{intent.transactionId}</p>
          <button onClick={() => pay('success')} className="mb-2 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white">Pay (simulate success)</button>
          <button onClick={() => pay('failure')} className="w-full rounded-xl border border-red-300 py-2.5 text-sm font-semibold text-red-600">Simulate failure</button>
        </div>
      )}

      {step === 'processing' && (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="font-semibold">Payment processing…</p>
        </div>
      )}

      {step === 'success' && intent && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
          <h2 className="text-xl font-extrabold text-emerald-700">Payment Successful</h2>
          <p className="mt-2">Contribution: <b>{inr(intent.amount)}</b></p>
          <p>Contributor: <b>{form.contributorName}</b></p>
          <p className="mt-2 text-sm text-slate-500">Demo payment · {intent.transactionId}</p>
          <p className="mt-4 text-sm">Look at the screen — your name is up there 🙏</p>
          <button onClick={reset} className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm">Contribute again</button>
        </div>
      )}

      {step === 'failed' && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">✕</div>
          <h2 className="text-xl font-extrabold text-red-700">Payment Failed</h2>
          <p className="mt-2 text-sm text-slate-600">{msg} — nothing was added to the campaign.</p>
          <button onClick={reset} className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white">Try again</button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="mx-auto min-h-screen max-w-md bg-gradient-to-b from-orange-50 to-white p-4">{children}</div>;
}
