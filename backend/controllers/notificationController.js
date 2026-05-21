import Notification from '../models/Notification.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

export const getNotifications = async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
      const notifications = await Notification.find({ forStaff: true })
        .sort('-createdAt')
        .limit(50);
      
      const mapped = notifications.map(n => ({
        ...n.toObject(),
        isRead: n.readBy.includes(staff._id)
      }));
      return res.json(mapped);
    } else {
      const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
      if (!customer) return res.json([]);
      const notifications = await Notification.find({ recipientCustomer: customer._id })
        .sort('-createdAt')
        .limit(50);
      return res.json(notifications);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'admin' || req.user.role === 'staff') {
      const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
      if (!notification.readBy.includes(staff._id)) {
        notification.readBy.push(staff._id);
        await notification.save();
      }
    } else {
      notification.isRead = true;
      await notification.save();
    }
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
      await Notification.updateMany(
        { forStaff: true, readBy: { $ne: staff._id } },
        { $push: { readBy: staff._id } }
      );
    } else {
      const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
      if (customer) {
        await Notification.updateMany(
          { recipientCustomer: customer._id, isRead: false },
          { isRead: true }
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
