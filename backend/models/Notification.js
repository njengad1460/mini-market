import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // For a specific customer
  recipientCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  // Or for all admins/staff
  forStaff: { type: Boolean, default: false },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Staff who have read this

  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String }, // 'payment', 'order', 'request'
  link:    { type: String }, // Frontend route, e.g. '/dashboard/orders/123' or '/settings'
  
  // For customers: simple isRead flag
  isRead:  { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
