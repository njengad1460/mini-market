import CashSession from '../models/CashSession.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// Open a new cash session
export const openSession = async (req, res) => {
  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });

    // check no open session already
    const existing = await CashSession.findOne({ staff: staff._id, closedAt: null });
    if (existing) return res.status(400).json({ message: 'You already have an open session' });

    const session = await CashSession.create({ staff: staff._id });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Record a transaction in the current session
export const recordTransaction = async (req, res) => {
  const { orderId, amount, method, reference } = req.body;

  try {
    const staff   = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const session = await CashSession.findOne({ staff: staff._id, closedAt: null });
    if (!session) return res.status(404).json({ message: 'No open session found' });

    session.transactions.push({ order: orderId, amount, method, reference });
    session.totalCollected += amount;
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Close the current session
export const closeSession = async (req, res) => {
  try {
    const staff   = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const session = await CashSession.findOne({ staff: staff._id, closedAt: null });
    if (!session) return res.status(404).json({ message: 'No open session found' });

    session.closedAt = new Date();
    await session.save();

    await AuditLog.create({
      actor:       staff._id,
      action:      'CLOSE_CASH_SESSION',
      targetModel: 'CashSession',
      targetId:    session._id,
      diff:        { after: { totalCollected: session.totalCollected, closedAt: session.closedAt } },
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current open session
export const getActiveSession = async (req, res) => {
  try {
    const staff   = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const session = await CashSession.findOne({ staff: staff._id, closedAt: null })
      .populate('transactions.order', 'totalAmount');
    res.json(session || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin — get all sessions
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await CashSession.find()
      .populate('staff', 'name')
      .sort('-createdAt')
      .limit(50);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
