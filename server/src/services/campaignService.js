import Contribution from '../models/Contribution.js';
import Campaign from '../models/Campaign.js';

export function computeState(c, now = new Date()) {
  const end = new Date(c.endDate);
  end.setHours(23, 59, 59, 999);
  if (c.status === 'paused') return 'paused';
  if (now < new Date(c.startDate)) return 'upcoming';
  if (now > end) return 'expired';
  return 'active';
}

// All derived numbers are computed here, never on the client.
export function computeTotals(c) {
  const remainingAmount = Math.max(0, c.targetAmount - c.totalCollected);
  const rawProgress = (c.totalCollected / c.targetAmount) * 100;
  return {
    remainingAmount,
    progressPercentage: Math.min(100, Math.round(rawProgress * 10) / 10),
    goalAchieved: c.totalCollected >= c.targetAmount,
    exceededBy: Math.max(0, c.totalCollected - c.targetAmount),
  };
}

const publicContribution = (x) => ({
  id: x._id,
  contributorName: x.contributorName,
  amount: x.amount,
  message: x.message,
  createdAt: x.createdAt,
});

export async function buildPublicView(c) {
  const recent = await Contribution.find({ campaignId: c._id, paymentStatus: 'successful' })
    .sort({ createdAt: -1 })
    .limit(8);
  const base = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
  return {
    id: c._id,
    name: c.name,
    title: c.title,
    description: c.description,
    location: c.location,
    logo: c.logo,
    upiId: c.upiId,
    targetAmount: c.targetAmount,
    totalCollected: c.totalCollected,
    contributorCount: c.contributorCount,
    startDate: c.startDate,
    endDate: c.endDate,
    state: computeState(c),
    donateUrl: `${base}${c.qrCode || '/donate/' + c._id}`,
    ...computeTotals(c),
    latest: recent[0] ? publicContribution(recent[0]) : null,
    recent: recent.map(publicContribution),
  };
}

export async function getCampaignOr404(id) {
  const c = await Campaign.findById(id);
  if (!c) {
    const err = new Error('Campaign not found');
    err.status = 404;
    throw err;
  }
  return c;
}
