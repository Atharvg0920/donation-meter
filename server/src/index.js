import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { ensureDemoCampaign } from './seed.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(404).json({ error: 'Invalid campaign ID' });
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate record' });
  if (err.status !== 404) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
});

const port = process.env.PORT || 5000;
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
  await ensureDemoCampaign();
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
} catch (e) {
  console.error('Startup failed:', e.message);
  process.exit(1);
}
