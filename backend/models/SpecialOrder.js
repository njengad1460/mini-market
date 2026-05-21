import mongoose from 'mongoose';

const specialOrderSchema = new mongoose.Schema({
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  photoUrl:    { type: String }, // S3 URL
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Shoe' },
  productName: { type: String },
  requestedSize: { type: String },
  requestedColor: { type: String },
  description: { type: String },
  quotedAmount: { type: Number, default: 0 },
  requiredDeposit: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  depositPaidAt: { type: Date },
  depositPaymentMethod: { type: String, enum: ['cash', 'mpesa'] },
  finalPaymentPaid: { type: Boolean, default: false },
  finalPaymentAt: { type: Date },
  finalPaymentMethod: { type: String, enum: ['cash', 'mpesa'] },
  status: {
    type: String,
    enum: ['pending', 'awaiting_deposit', 'ordered', 'awaiting_final_payment', 'fulfilled', 'rejected'],
    default: 'pending',
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('SpecialOrder', specialOrderSchema);
