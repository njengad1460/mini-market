import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  shoe:        { type: String, enum: ['left', 'right'], required: true },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveredAt: { type: Date, default: Date.now },
  location:    { type: String }, // delivery address or GPS note
}, { _id: false });

const installmentSchema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  paidAt:    { type: Date, default: Date.now },
  reference: { type: String }, // M-Pesa or cash ref
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  // guest walkin — phone only, no account
  guestPhone: { type: String },

  items: [{
    shoe:     { type: mongoose.Schema.Types.ObjectId, ref: 'Shoe', required: true },
    size:     { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price:    { type: Number, required: true },
  }],

  orderType: { type: String, enum: ['direct', 'sample_request'], default: 'direct' },

  // payment
  paymentType:  { type: String, enum: ['full', 'credit'], default: 'full' },
  totalAmount:  { type: Number, required: true },
  paidAmount:   { type: Number, default: 0 },
  installments: [installmentSchema],

  // discounts
  walletDiscount:  { type: Number, default: 0 },
  manualDiscount:  { type: Number, default: 0 }, // applied by staff
  discountBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // partial delivery tracking
  deliveries: [deliverySchema],

  status: {
    type: String,
    enum: ['pending', 'partial_delivered', 'delivered', 'cancelled'],
    default: 'pending',
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null if self-placed
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
