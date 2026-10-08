// Payment provider boundary. To go live, add a provider (e.g. Razorpay) with the same two functions
// and select it via PAYMENT_MODE. Nothing else in the codebase needs to change.
import { nanoid } from 'nanoid';

const demoProvider = {
  mode: 'demo',
  // Step 1: create an order/intent with the provider. Real: razorpay.orders.create({ amount: amount*100, currency:'INR' })
  async createOrder({ amount, campaignId }) {
    return { transactionId: 'DEMO-' + nanoid(12), providerOrderId: null, amount, campaignId, demo: true };
  },
  // Step 2: verify payment server-side. Real: verify the Razorpay signature / webhook. NEVER trust the browser.
  async verifyPayment({ contribution, payload }) {
    if (payload?.simulate === 'failure') return { ok: false, reason: 'Demo payment failed' };
    return { ok: true };
  },
};

const providers = { demo: demoProvider };

export function getPaymentProvider() {
  const mode = process.env.PAYMENT_MODE || 'demo';
  const provider = providers[mode];
  if (!provider) throw new Error(`Unsupported PAYMENT_MODE: ${mode}`);
  return provider;
}
