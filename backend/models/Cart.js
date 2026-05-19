import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  // either a registered customer or a guest session
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  sessionId: { type: String }, // for guests

  items: [{
    shoe:     { type: mongoose.Schema.Types.ObjectId, ref: 'Shoe', required: true },
    size:     { type: String, required: true },
    quantity: { type: Number, default: 1 },
  }],
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
