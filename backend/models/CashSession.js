import mongoose from 'mongoose';

const cashSessionSchema = new mongoose.Schema({
  staff:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },

  transactions: [{
    order:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount:    { type: Number, required: true },
    method:    { type: String, enum: ['cash', 'mpesa'], required: true },
    reference: { type: String }, // M-Pesa ref
    recordedAt:{ type: Date, default: Date.now },
  }],

  totalCollected: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('CashSession', cashSessionSchema);
