import cron from 'node-cron';
import OfflineQueue from '../models/offlineQueue.js';

const processQueue = async () => {
  console.log('Running Offline Sync Job...');
  try {
    const pendingItems = await OfflineQueue.find({ status: 'pending' }).limit(50);
    
    if (pendingItems.length === 0) {
      console.log('No pending items to process.');
      return;
    }

    console.log(`Processing ${pendingItems.length} offline actions...`);

    for (const item of pendingItems) {
      item.status = 'processing';
      await item.save();

      try {
        // In a real scenario, you would route the payload to the appropriate service
        // based on item.action. Here we just mark it as completed.
        console.log(`Successfully processed action: ${item.action}`);
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 300));
        
        item.status = 'completed';
        await item.save();
      } catch (err) {
        console.error(`Error processing action ${item.action}:`, err.message);
        item.status = 'failed';
        item.error = err.message;
        item.retryCount += 1;
        await item.save();
      }
    }
  } catch (error) {
    console.error('Error in offline sync job:', error);
  }
};

// Run job every 5 minutes
export const startOfflineSyncJob = () => {
  cron.schedule('*/5 * * * *', processQueue);
  console.log('Offline sync job scheduled to run every 5 minutes.');
};
