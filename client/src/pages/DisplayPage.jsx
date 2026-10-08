import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useLiveCampaign } from '../hooks/useLiveCampaign.js';
import ProgressRing from '../components/ProgressRing.jsx';
import { inr } from '../lib/format.js';

// Everything is sized in vw so the layout scales to any LED/TV resolution.
export default function DisplayPage() {
  const { id } = useParams();
  const { campaign: c, error, connected } = useLiveCampaign(id);
  const [highlight, setHighlight] = useState(false);
  const lastId = useRef(null);

  // Trigger the highlight animation whenever a NEW contribution arrives (not on first load)
  useEffect(() => {
    const latestId = c?.latest?.id || null;
    if (lastId.current !== null && latestId && latestId !== lastId.current) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 8000);
      lastId.current = latestId;
      return () => clearTimeout(t);
    }
    lastId.current = latestId;
  }, [c?.latest?.id]);

  if (error) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-[3vw] text-red-400">{error}</div>;
  if (!c) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-[3vw] text-white">Loading…</div>;

  const inactive = c.state !== 'active';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-[2vw] text-white">
      <div className="pointer-events-none absolute -left-[10vw] -top-[10vw] h-[40vw] w-[40vw] rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-[10vw] -right-[10vw] h-[40vw] w-[40vw] rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative grid min-h-[96vh] grid-cols-12 gap-[2vw]">
        {/* LEFT: title + meter + numbers */}
        <div className="col-span-7 flex flex-col justify-between">
          <div className="flex items-center gap-[1.5vw]">
            {c.logo && <img src={c.logo} alt="" className="h-[6vw] w-[6vw] rounded-[1vw] object-cover" />}
            <div>
              <div className="text-[1.8vw] font-semibold uppercase tracking-[0.3em] text-amber-300">{c.name}</div>
              <h1 className="text-[4.2vw] font-black leading-tight">{c.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-[3vw]">
            <ProgressRing percent={c.progressPercentage} size={Math.round(window.innerWidth * 0.26)} stroke={Math.round(window.innerWidth * 0.022)}>
              <div className="text-[5.5vw] font-black leading-none">{Math.floor(c.progressPercentage)}%</div>
              <div className="text-[1.5vw] uppercase tracking-widest text-slate-300">Funded</div>
            </ProgressRing>
            <div className="space-y-[1.6vw]">
              <Stat label="Target Amount" value={inr(c.targetAmount)} />
              <Stat label="Collected" value={inr(c.totalCollected)} color="text-emerald-400" big />
              <Stat label="Remaining" value={inr(c.remainingAmount)} color="text-amber-300" />
            </div>
          </div>

          <div className="h-[2.2vw] overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${c.progressPercentage}%`, transition: 'width 1.5s cubic-bezier(.22,1,.36,1)' }} />
          </div>

          <div className="text-[2.6vw] font-bold">
            {c.goalAchieved
              ? <span className="text-emerald-400">GOAL ACHIEVED 🎉 — Thank you to all contributors!</span>
              : <span className="text-amber-300">{inr(c.remainingAmount)} MORE NEEDED</span>}
          </div>
        </div>

        {/* RIGHT: latest contribution + QR */}
        <div className="col-span-5 flex flex-col gap-[2vw]">
          <div className={`flex flex-1 flex-col justify-center rounded-[2vw] border border-white/10 bg-white/5 p-[2.5vw] backdrop-blur ${highlight ? 'animate-glow border-amber-300' : ''}`}>
            <div className="text-[1.5vw] font-semibold uppercase tracking-[0.3em] text-slate-300">Latest Contribution</div>
            {c.latest ? (
              <div key={c.latest.id} className="animate-pop">
                <div className="mt-[1vw] text-[4vw] font-black leading-tight">{c.latest.contributorName}</div>
                <div className="text-[5vw] font-black text-amber-300">{inr(c.latest.amount)}</div>
                <p className="mt-[0.5vw] text-[1.9vw] text-slate-100">
                  Thank you {c.latest.contributorName} for your generous contribution!
                </p>
                {c.latest.message && <p className="mt-[0.5vw] text-[1.5vw] italic text-slate-300">“{c.latest.message}”</p>}
              </div>
            ) : (
              <p className="mt-[1vw] text-[2.2vw] text-slate-300">Be the first to contribute 🙏</p>
            )}
          </div>

          <div className="flex items-center gap-[2vw] rounded-[2vw] bg-white p-[2vw] text-slate-900">
            <QRCodeSVG value={c.donateUrl} level="H" className="h-[16vw] w-[16vw] shrink-0" />
            <div>
              <div className="text-[2.6vw] font-black leading-tight text-orange-600">SCAN TO CONTRIBUTE</div>
              <p className="mt-[0.6vw] text-[1.4vw] text-slate-600">Scan the QR code to support this campaign.</p>
              {inactive && <p className="mt-[0.6vw] text-[1.4vw] font-bold text-red-600">Campaign {c.state}</p>}
            </div>
          </div>
        </div>
      </div>

      {highlight && c.latest && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[8vw] flex justify-center">
          <div className="animate-float text-[7vw]">🎉 🙏 🎉</div>
        </div>
      )}
      <div className={`absolute bottom-[0.8vw] right-[1vw] text-[0.9vw] ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
        {connected ? '● live' : '● reconnecting…'}
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-white', big }) {
  return (
    <div>
      <div className="text-[1.4vw] uppercase tracking-widest text-slate-300">{label}</div>
      <div className={`font-black leading-none transition-all ${color} ${big ? 'text-[6vw]' : 'text-[4.5vw]'}`}>{value}</div>
    </div>
  );
}
