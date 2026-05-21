import Customer from '../models/Customer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { formatPhone } from '../utils/formatPhone.js';
import { ensureCustomerProfile } from './authController.js';
import { uploadImageBuffer } from '../services/s3Service.js';

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
  const normalizedPhone = formatPhone(phone);

  try {
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });

    const customer = await Customer.create({
      name,
      phone: normalizedPhone,
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
    await ensureCustomerProfile(req.user);

    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub })
      .populate('balanceUpdates.updatedBy', 'name role')
      .populate('referredBy', 'name referralCode');

    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });

    const referredCustomers = await Customer.find({ referredBy: customer._id })
      .select('name phone email createdAt referralBonusAwardedAt referralBonusSourceOrder profileComplete')
      .sort('-createdAt');

    res.json({
      ...customer.toObject(),
      referredCustomers: referredCustomers.map((referral) => ({
        _id: referral._id,
        name: referral.name,
        phone: referral.phone,
        email: referral.email,
        joinedAt: referral.createdAt,
        profileComplete: referral.profileComplete,
        hasQualifiedPurchase: Boolean(referral.referralBonusAwardedAt),
        bonusAwardedAt: referral.referralBonusAwardedAt || null,
        qualifyingOrderId: referral.referralBonusSourceOrder || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMyProfile = async (req, res) => {
  const { name, phone, address, profileImage, referralCode } = req.body;

  try {
    const customer = await ensureCustomerProfile({
      ...req.user,
      name: name || req.user.name,
      phone: phone || req.user.phone,
    });

    const before = customer.toObject();

    if (name?.trim()) customer.name = name.trim();
    const normalizedPhone = formatPhone(phone);
    if (normalizedPhone && normalizedPhone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone: normalizedPhone, _id: { $ne: customer._id } });
      if (phoneExists) return res.status(409).json({ message: 'Phone number already in use' });
      customer.phone = normalizedPhone;
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
    const status = err.message?.includes('already registered') || err.message?.includes('already in use') ? 409 : 500;
    res.status(status).json({ message: err.message });
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
export const applyReferralBonus = async (referredCustomerId, qualifyingOrderId) => {
  const referred = await Customer.findById(referredCustomerId);
  if (!referred?.referredBy) return;
  if (referred.referralBonusAwardedAt) return;

  await Customer.findByIdAndUpdate(referred.referredBy, {
    $inc: { walletBalance: 100 },
  });

  referred.referralBonusAwardedAt = new Date();
  referred.referralBonusSourceOrder = qualifyingOrderId;
  await referred.save();
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const customer = await ensureCustomerProfile(req.user);
    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const uploaded = await uploadImageBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder: 'profile',
    });

    const before = customer.toObject();
    customer.profileImage = uploaded.url;
    await customer.save();

    const actor = await User.findOne({ cognitoSub: req.user.cognitoSub });
    if (actor?._id) {
      await AuditLog.create({
        actor: actor._id,
        action: 'UPLOAD_PROFILE_IMAGE',
        targetModel: 'Customer',
        targetId: customer._id,
        diff: { before: { profileImage: before.profileImage }, after: { profileImage: customer.profileImage } },
      });
    }

    res.status(201).json({
      message: 'Profile image uploaded successfully',
      profileImage: customer.profileImage,
      customer,
    });
  } catch (err) {
    const message = err.message || 'Profile image upload failed';
    const statusCode = /required|unsupported|limit/i.test(message) ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

// Withdraw from wallet — max 50% at a time
export const withdrawWallet = async (req, res) => {
  try {
    const customer   = await ensureCustomerProfile(req.user);
    const maxWithdraw = Math.floor(customer.walletBalance / 2);

    if (maxWithdraw < 1) return res.status(400).json({ message: 'Insufficient wallet balance' });

    customer.walletBalance -= maxWithdraw;
    await customer.save();

    res.json({ withdrawn: maxWithdraw, remaining: customer.walletBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
