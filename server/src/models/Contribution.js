import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const contributionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'CTB-' + nanoid(10) },
    campaignId: { type: String, required: true, index: true },
    contributorName: { type: String, required: true, trim: true, maxlength: 60 },
    amount: { type: Number, required: true, min: 1 },
    message: { type: String, default: '', maxlength: 200 },
    paymentStatus: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
    transactionId: { type: String, required: true, unique: true },
    paymentMode: { type: String, default: 'demo' },
  },
  { timestamps: true }
);

export default mongoose.model('Contribution', contributionSchema);
