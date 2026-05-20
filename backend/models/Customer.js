import mongoose from 'mongoose';

const balanceUpdateSchema = new mongoose.Schema({
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ['credit', 'debit'], required: true },
  note:          { type: String },
  previousValue: { type: Number, required: true },
  newValue:      { type: Number, required: true },
  updatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt:     { type: Date, default: Date.now },
}, { _id: true });

const customerSchema = new mongoose.Schema({
  // registered via web (email/Google/Facebook) or walkin registered by staff
  registrationType: { type: String, enum: ['registered', 'walkin'], required: true },

  // only for registered customers (Cognito sub)
  cognitoSub: { type: String, sparse: true, unique: true },

  name:  { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true, unique: true },

  // location — browser geolocation for registered, staff-pinned for walkin
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    address:     { type: String },
  },

  // walk-in customers registered by a staff member
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  referralCodeChanged: { type: Boolean, default: false },
  referralBonusAwardedAt: { type: Date },
  referralBonusSourceOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  profileImage: { type: String },

  // bonus wallet
  walletBalance: { type: Number, default: 0 },
  shoeBalance:   { type: Number, default: 0 },
  balanceUpdates: [balanceUpdateSchema],

  // Facebook/Google users must complete phone + location before ordering
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

customerSchema.index({ location: '2dsphere' });

export default mongoose.model('Customer', customerSchema);
