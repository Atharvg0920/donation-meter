import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const campaignSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => nanoid(8) },
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    targetAmount: { type: Number, required: true, min: 1 },
    totalCollected: { type: Number, default: 0, min: 0 }, // only changed by the server on verified payments
    contributorCount: { type: Number, default: 0 },
    location: { type: String, default: '' },
    upiId: { type: String, default: '' },
    logo: { type: String, default: '' }, // data URL or http URL
    qrCode: { type: String, default: '' }, // donation path encoded in the QR
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Campaign', campaignSchema);
