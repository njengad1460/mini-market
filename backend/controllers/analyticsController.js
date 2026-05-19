import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

// Overall website performance
export const getOverview = async (req, res) => {
  try {
    const [totalOrders, totalCustomers, revenue] = await Promise.all([
      Order.countDocuments(),
      Customer.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
    ]);

    res.json({
      totalOrders,
      totalCustomers,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff performance — registrations and deliveries per staff
export const getStaffPerformance = async (req, res) => {
  try {
    const [registrations, deliveries] = await Promise.all([
      Customer.aggregate([
        { $match: { registrationType: 'walkin' } },
        { $group: { _id: '$registeredBy', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
        { $unwind: '$staff' },
        { $project: { staffName: '$staff.name', registrations: '$count' } },
      ]),
      Order.aggregate([
        { $unwind: '$deliveries' },
        { $group: { _id: '$deliveries.deliveredBy', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
        { $unwind: '$staff' },
        { $project: { staffName: '$staff.name', deliveries: '$count' } },
      ]),
    ]);

    res.json({ registrations, deliveries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin views audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { model, actorId } = req.query;
    const filter = {};
    if (model)   filter.targetModel = model;
    if (actorId) filter.actor       = actorId;

    const logs = await (await import('../models/AuditLog.js')).default
      .find(filter)
      .populate('actor', 'name role')
      .sort('-createdAt')
      .limit(200);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
