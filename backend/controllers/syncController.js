import OfflineQueue from '../models/offlineQueue.js';

export const syncOfflineData = async (req, res) => {
  try {
    const { actions } = req.body;
    
    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ message: 'Invalid actions array' });
    }

    if (actions.length === 0) {
      return res.status(200).json({ message: 'No actions to sync' });
    }

    const queueItems = actions.map(action => ({
      action: action.method + ' ' + action.url,
      payload: action.body || {},
      status: 'pending'
    }));

    await OfflineQueue.insertMany(queueItems);

    res.status(200).json({ message: 'Offline actions queued successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing offline data', error: error.message });
  }
};
