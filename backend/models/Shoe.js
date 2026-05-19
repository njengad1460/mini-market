import mongoose from 'mongoose';

const shoeSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  brand:     { type: String },
  price:     { type: Number, required: true },
  costPrice: { type: Number, required: true }, // admin-only field
  sizes:     [{ size: String, stock: { type: Number, default: 0 } }],
  images:    [String], // S3 URLs
  category:  { type: String },

  // staff adds → pending, admin approves → active
  status:  { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Shoe', shoeSchema);
