import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:      { type: String, required: true }, // e.g. 'UPDATE_ORDER', 'ADD_PRODUCT'
  targetModel: { type: String, required: true }, // e.g. 'Order', 'Shoe'
  targetId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  diff:        { type: mongoose.Schema.Types.Mixed }, // { before: {}, after: {} }
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
