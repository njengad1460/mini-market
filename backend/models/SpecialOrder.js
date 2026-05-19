import mongoose from 'mongoose';

const specialOrderSchema = new mongoose.Schema({
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  photoUrl:    { type: String, required: true }, // S3 URL
  description: { type: String },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'fulfilled', 'rejected'],
    default: 'pending',
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('SpecialOrder', specialOrderSchema);
