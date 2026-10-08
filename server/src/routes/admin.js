import { Router } from 'express';
import Campaign from '../models/Campaign.js';
import Contribution from '../models/Contribution.js';
import { requireAdmin } from '../middleware/auth.js';
import { buildPublicView, getCampaignOr404, computeState, computeTotals } from '../services/campaignService.js';
import { broadcast } from '../services/sse.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.post('/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ error: 'Wrong password' });
});

router.use(requireAdmin);

function pickFields(body) {
  const f = {};
  for (const k of ['name', 'title', 'description', 'location', 'upiId', 'logo', 'status']) if (body[k] !== undefined) f[k] = body[k];
  if (body.targetAmount !== undefined) f.targetAmount = Number(body.targetAmount);
  if (body.startDate) f.startDate = new Date(body.startDate);
  if (body.endDate) f.endDate = new Date(body.endDate);
  return f;
}

function validate(f, isNew) {
  if (isNew && (!f.name || !f.title)) return 'Organization name and campaign title are required';
  if (f.targetAmount !== undefined && !(f.targetAmount > 0)) return 'Target amount must be greater than 0';
  if (isNew && (!f.startDate || !f.endDate)) return 'Start and end dates are required';
  if (f.startDate && f.endDate && f.endDate < f.startDate) return 'End date must be after start date';
  if (f.logo && f.logo.length > 600000) return 'Logo is too large (max ~400 KB)';
  return null;
}

router.get('/stats', wrap(async (req, res) => {
  const campaigns = await Campaign.find();
  const recent = await Contribution.find({ paymentStatus: 'successful' }).sort({ createdAt: -1 }).limit(8);
  res.json({
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => computeState(c) === 'active').length,
    totalCollected: campaigns.reduce((s, c) => s + c.totalCollected, 0),
    totalContributors: campaigns.reduce((s, c) => s + c.contributorCount, 0),
    recent,
  });
}));

router.get('/campaigns', wrap(async (req, res) => {
  const list = await Campaign.find().sort({ createdAt: -1 });
  res.json(list.map((c) => ({ ...c.toObject(), state: computeState(c), ...computeTotals(c) })));
}));

router.post('/campaigns', wrap(async (req, res) => {
  const f = pickFields(req.body);
  const err = validate(f, true);
  if (err) return res.status(400).json({ error: err });
  const c = new Campaign(f);
  c.qrCode = `/donate/${c._id}`;
  await c.save();
  res.status(201).json(c);
}));

router.put('/campaigns/:id', wrap(async (req, res) => {
  const f = pickFields(req.body); // totalCollected is intentionally not editable
  const err = validate(f, false);
  if (err) return res.status(400).json({ error: err });
  const c = await Campaign.findByIdAndUpdate(req.params.id, f, { new: true });
  if (!c) return res.status(404).json({ error: 'Campaign not found' });
  broadcast(c._id, 'update', await buildPublicView(c));
  res.json(c);
}));

router.delete('/campaigns/:id', wrap(async (req, res) => {
  const c = await getCampaignOr404(req.params.id);
  await Contribution.deleteMany({ campaignId: c._id });
  await Campaign.findByIdAndDelete(c._id);
  res.json({ ok: true });
}));

router.get('/campaigns/:id/contributions', wrap(async (req, res) => {
  const c = await getCampaignOr404(req.params.id);
  res.json(await Contribution.find({ campaignId: c._id }).sort({ createdAt: -1 }).limit(500));
}));

// Demo helper: wipe contributions so the demo can be repeated
router.post('/campaigns/:id/reset', wrap(async (req, res) => {
  await getCampaignOr404(req.params.id);
  await Contribution.deleteMany({ campaignId: req.params.id });
  const c = await Campaign.findByIdAndUpdate(req.params.id, { totalCollected: 0, contributorCount: 0 }, { new: true });
  broadcast(c._id, 'update', await buildPublicView(c));
  res.json({ ok: true });
}));

export default router;
