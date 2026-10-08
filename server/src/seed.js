import Campaign from './models/Campaign.js';

export async function ensureDemoCampaign() {
  if (await Campaign.findById('demo')) return;
  const start = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  await Campaign.create({
    _id: 'demo',
    name: 'Shree Ram Mandir',
    title: 'Temple Renovation Fund',
    description: 'Help us restore and renovate the temple for the whole community. Every contribution counts.',
    targetAmount: 10000,
    location: 'Mumbai, Maharashtra',
    upiId: 'temple@upi',
    qrCode: '/donate/demo',
    startDate: start,
    endDate: end,
  });
  console.log('Demo campaign created: id = demo');
}
