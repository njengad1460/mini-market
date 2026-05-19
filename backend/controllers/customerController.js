import Customer from '../models/Customer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const generateUniqueReferralCode = async (candidate) => {
  const seed = (candidate || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  let code = seed || Math.random().toString(36).slice(2, 10).toUpperCase();

  while (await Customer.exists({ referralCode: code })) {
    if (candidate) return null;
    code = Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  return code;
};

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
    const customers = await Customer.find()
      .populate('registeredBy', 'name')
      .select('-balanceUpdates')
      .sort('-createdAt');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('registeredBy', 'name')
      .populate('balanceUpdates.updatedBy', 'name role');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub })
      .populate('balanceUpdates.updatedBy', 'name role')
      .populate('referredBy', 'name referralCode');

    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMyProfile = async (req, res) => {
  const { name, phone, address, profileImage, referralCode } = req.body;

  try {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    const before = customer.toObject();

    if (name?.trim()) customer.name = name.trim();
    if (phone?.trim() && phone.trim() !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone: phone.trim(), _id: { $ne: customer._id } });
      if (phoneExists) return res.status(409).json({ message: 'Phone number already in use' });
      customer.phone = phone.trim();
    }

    if (typeof address === 'string') {
      customer.location = {
        type: 'Point',
        coordinates: customer.location?.coordinates?.length ? customer.location.coordinates : [0, 0],
        address: address.trim(),
      };
    }

    if (typeof profileImage === 'string') {
      const trimmedImage = profileImage.trim();
      if (trimmedImage && !trimmedImage.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Profile image must be a valid image upload' });
      }
      customer.profileImage = trimmedImage || undefined;
    }

    if (typeof referralCode === 'string') {
      const normalizedCode = referralCode.trim().toUpperCase();
      if (normalizedCode && normalizedCode !== customer.referralCode) {
        if (customer.referralCodeChanged) {
          return res.status(400).json({ message: 'Referral code can only be changed once' });
        }

        const uniqueCode = await generateUniqueReferralCode(normalizedCode);
        if (!uniqueCode) {
          return res.status(409).json({ message: 'Referral code already in use' });
        }

        customer.referralCode = uniqueCode;
        customer.referralCodeChanged = true;
      }
    }

    await customer.save();

    res.json(customer);

    const actor = await User.findOne({ cognitoSub: req.user.cognitoSub });
    if (actor?._id) {
      await AuditLog.create({
        actor:       actor._id,
        action:      'UPDATE_CUSTOMER_PROFILE',
        targetModel: 'Customer',
        targetId:    customer._id,
        diff:        { before, after: customer.toObject() },
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomerBalance = async (req, res) => {
  const { amount, note, type } = req.body;

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const customer = await Customer.findById(req.params.id);

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ message: 'Invalid balance update type' });
    }

    const previousValue = customer.shoeBalance || 0;
    const signedAmount = type === 'credit' ? numericAmount : -numericAmount;
    const newValue = previousValue + signedAmount;

    customer.shoeBalance = newValue;
    customer.balanceUpdates.unshift({
      amount: numericAmount,
      type,
      note: note?.trim() || '',
      previousValue,
      newValue,
      updatedBy: staff._id,
    });

    await customer.save();
    await customer.populate('balanceUpdates.updatedBy', 'name role');

    await AuditLog.create({
      actor:       staff._id,
      action:      'UPDATE_CUSTOMER_SHOE_BALANCE',
      targetModel: 'Customer',
      targetId:    customer._id,
      diff:        {
        before: { shoeBalance: previousValue },
        after:  { shoeBalance: newValue, amount: numericAmount, type, note: note?.trim() || '' },
      },
    });

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
