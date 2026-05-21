import mongoose from 'mongoose';

const offlineQueueSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('OfflineQueue', offlineQueueSchema);
