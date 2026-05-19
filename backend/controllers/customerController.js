import Customer from '../models/Customer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// Staff registers a walk-in customer with pinned location
export const registerWalkin = async (req, res) => {
  const { name, phone, address, coordinates } = req.body;

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });

    const customer = await Customer.create({
      name,
      phone,
      registrationType: 'walkin',
      registeredBy:     staff._id,
      location:         { type: 'Point', coordinates, address },
      profileComplete:  true,
    });

    await AuditLog.create({
      actor:       staff._id,
      action:      'REGISTER_WALKIN_CUSTOMER',
      targetModel: 'Customer',
      targetId:    customer._id,
      diff:        { after: { name, phone, address } },
    });

    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('registeredBy', 'name').sort('-createdAt');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('registeredBy', 'name');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Called internally when a referred customer's order exceeds 999
export const applyReferralBonus = async (referredCustomerId) => {
  const referred = await Customer.findById(referredCustomerId);
  if (!referred?.referredBy) return;

  await Customer.findByIdAndUpdate(referred.referredBy, {
    $inc: { walletBalance: 100 },
  });
};

// Withdraw from wallet — max 50% at a time
export const withdrawWallet = async (req, res) => {
  try {
    const customer   = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
    const maxWithdraw = Math.floor(customer.walletBalance / 2);

    if (maxWithdraw < 1) return res.status(400).json({ message: 'Insufficient wallet balance' });

    customer.walletBalance -= maxWithdraw;
    await customer.save();

    res.json({ withdrawn: maxWithdraw, remaining: customer.walletBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
