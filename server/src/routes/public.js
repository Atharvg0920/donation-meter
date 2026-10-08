import { Router } from 'express';
import Campaign from '../models/Campaign.js';
import Contribution from '../models/Contribution.js';
import { buildPublicView, getCampaignOr404, computeState } from '../services/campaignService.js';
import { getPaymentProvider } from '../services/paymentService.js';
import { subscribe, broadcast } from '../services/sse.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/campaigns/:id', wrap(async (req, res) => {
  res.json(await buildPublicView(await getCampaignOr404(req.params.id)));
}));

// Real-time channel for the LED display and donation page
router.get('/campaigns/:id/stream', wrap(async (req, res) => {
  const campaign = await getCampaignOr404(req.params.id);
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write(`event: update\ndata: ${JSON.stringify(await buildPublicView(campaign))}\n\n`);
  subscribe(campaign._id, res);
  const ping = setInterval(() => res.write(': ping\n\n'), 20000);
  res.on('close', () => clearInterval(ping));
}));

// Step 1: create a pending contribution + payment order
router.post('/campaigns/:id/intent', wrap(async (req, res) => {
  const campaign = await getCampaignOr404(req.params.id);
  const state = computeState(campaign);
  if (state !== 'active') return res.status(400).json({ error: `Campaign is ${state}` });

  const name = String(req.body.contributorName || '').trim();
  const amount = Number(req.body.amount);
  const message = String(req.body.message || '').trim().slice(0, 200);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'Amount must be a whole number greater than 0' });
  if (amount > 1000000) return res.status(400).json({ error: 'Amount too large' });

  const provider = getPaymentProvider();
  const order = await provider.createOrder({ amount, campaignId: campaign._id });
  const contribution = await Contribution.create({
    campaignId: campaign._id,
    contributorName: name.slice(0, 60),
    amount,
    message,
    transactionId: order.transactionId,
    paymentMode: provider.mode,
  });
  res.status(201).json({ contributionId: contribution._id, transactionId: order.transactionId, amount, demo: !!order.demo });
}));

// Step 2: verify payment, then (idempotently) credit the campaign
router.post('/campaigns/:id/confirm', wrap(async (req, res) => {
  const campaign = await getCampaignOr404(req.params.id);
  const contribution = await Contribution.findOne({ _id: req.body.contributionId, campaignId: campaign._id });
  if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
  if (contribution.paymentStatus !== 'pending') return res.json({ contribution, duplicate: true });

  const result = await getPaymentProvider().verifyPayment({ contribution, payload: req.body });
  if (!result.ok) {
    await Contribution.updateOne({ _id: contribution._id, paymentStatus: 'pending' }, { paymentStatus: 'failed' });
    return res.status(402).json({ error: result.reason || 'Payment failed' });
  }

  // Atomic pending -> successful transition guarantees the amount is counted only once
  const updated = await Contribution.findOneAndUpdate(
    { _id: contribution._id, paymentStatus: 'pending' },
    { paymentStatus: 'successful' },
    { new: true }
  );
  if (!updated) return res.json({ contribution, duplicate: true });

  const fresh = await Campaign.findByIdAndUpdate(
    campaign._id,
    { $inc: { totalCollected: updated.amount, contributorCount: 1 } },
    { new: true }
  );
  broadcast(campaign._id, 'update', await buildPublicView(fresh));
  res.json({ contribution: updated, duplicate: false });
}));

export default router;
