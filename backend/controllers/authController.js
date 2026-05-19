import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { nanoid } from 'nanoid';

// Called after Cognito login — syncs user to MongoDB
export const syncUser = async (req, res) => {
  const { cognitoSub, email, name, phone, role } = req.user;

  try {
    if (role === 'admin' || role === 'staff') {
      let user = await User.findOne({ cognitoSub });
      if (!user) {
        user = await User.create({ cognitoSub, email, name, phone, role });
      }
      return res.json({ role, user });
    }

    // customer — find or create
    let customer = await Customer.findOne({ cognitoSub });

    if (!customer) {
      // block duplicate phone
      const phoneExists = await Customer.findOne({ phone: phone || '' });
      if (phoneExists) {
        return res.status(409).json({
          message: 'This phone number is already registered to another account.',
        });
      }

      // check referral code passed via Cognito clientMetadata
      const referralCode = req.body?.referralCode || null;
      const referrer     = referralCode
        ? await Customer.findOne({ referralCode })
        : null;

      customer = await Customer.create({
        cognitoSub,
        name,
        email,
        phone:            phone || '',
        registrationType: 'registered',
        referralCode:     nanoid(8),
        profileComplete:  !!phone,
        referredBy:       referrer?._id || null,
      });
    }

    return res.json({ role: 'customer', customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Social login users (Google/Facebook) must complete phone + location
export const completeProfile = async (req, res) => {
  const { phone, address, coordinates } = req.body;

  try {
    const customer = await Customer.findOneAndUpdate(
      { cognitoSub: req.user.cognitoSub },
      {
        phone,
        location: { type: 'Point', coordinates, address },
        profileComplete: true,
      },
      { new: true }
    );

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
