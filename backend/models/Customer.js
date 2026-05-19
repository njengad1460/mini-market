import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  // registered via web (email/Google/Facebook) or walkin registered by staff
  registrationType: { type: String, enum: ['registered', 'walkin'], required: true },

  // only for registered customers (Cognito sub)
  cognitoSub: { type: String, sparse: true, unique: true },

  name:  { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, sparse: true },

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

  // bonus wallet
  walletBalance: { type: Number, default: 0 },

  // Facebook/Google users must complete phone + location before ordering
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

customerSchema.index({ location: '2dsphere' });

export default mongoose.model('Customer', customerSchema);
