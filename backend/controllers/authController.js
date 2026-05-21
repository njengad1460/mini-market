import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { nanoid } from 'nanoid';
import { formatPhone } from '../utils/formatPhone.js';

const generateUniqueReferralCode = async () => {
  let code = nanoid(8).toUpperCase();
  while (await Customer.exists({ referralCode: code })) {
    code = nanoid(8).toUpperCase();
  }
  return code;
};

export const ensureCustomerProfile = async ({ cognitoSub, email, name, phone }) => {
  let customer = await Customer.findOne({ cognitoSub });
  const normalizedPhone = formatPhone(phone);

  if (!customer) {
    const phoneExists = normalizedPhone
      ? await Customer.findOne({ phone: normalizedPhone })
      : null;

    if (phoneExists) {
      throw new Error('This phone number is already registered to another account.');
    }

    customer = await Customer.create({
      cognitoSub,
      name,
      email,
      phone: normalizedPhone,
      registrationType: 'registered',
      referralCode: await generateUniqueReferralCode(),
      profileComplete: false,
    });
  }

  if (!customer.referralCode) {
    customer.referralCode = await generateUniqueReferralCode();
  }

  if (name?.trim() && customer.name !== name.trim()) {
    customer.name = name.trim();
  }

  if (email?.trim() && customer.email !== email.trim()) {
    customer.email = email.trim();
  }

  if (normalizedPhone && customer.phone !== normalizedPhone) {
    const phoneOwner = await Customer.findOne({
      phone: normalizedPhone,
      _id: { $ne: customer._id },
    });

    if (phoneOwner) {
      throw new Error('This phone number is already registered to another account.');
    }

    customer.phone = normalizedPhone;
  }

  customer.profileComplete = Boolean(
    customer.phone &&
    (
      customer.location?.address?.trim() ||
      customer.location?.coordinates?.some((value) => Number(value) !== 0)
    )
  );

  await customer.save();
  return customer;
};

// Called after Cognito login — syncs user to MongoDB
export const syncUser = async (req, res) => {
  const { cognitoSub, email, name, phone, role } = req.user;

  try {
    if (role === 'admin' || role === 'staff') {
      let user = await User.findOne({ cognitoSub });
      if (!user) {
        user = await User.create({ 
          cognitoSub, 
          email, 
          name: name || (role === 'admin' ? 'System Admin' : 'Staff Member'), 
          phone: phone || '+254000000000', 
          role 
        });
      }
      return res.json({ role, user });
    }

    let customer = await ensureCustomerProfile({ cognitoSub, email, name, phone });

    if (!customer.referredBy && req.body?.referralCode) {
      const referrer = await Customer.findOne({ referralCode: req.body.referralCode });
      if (referrer && referrer._id.toString() !== customer._id.toString()) {
        customer.referredBy = referrer._id;
        await customer.save();
      }
    }

    return res.json({ role: 'customer', customer });
  } catch (err) {
    import('fs').then(fs => fs.appendFileSync('/home/davy/mini-market/backend/sync-error.log', new Date().toISOString() + ' ' + err.stack + '\n')).catch(() => {});
    const status = err.message?.includes('already registered') ? 409 : 500;
    res.status(status).json({ message: err.message, stack: err.stack });
  }
};

// Social login users (Google/Facebook) must complete phone + location
export const completeProfile = async (req, res) => {
  const { phone, address, coordinates } = req.body;
  const normalizedPhone = formatPhone(phone);

  try {
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const existingCustomer = await Customer.findOne({
      phone: normalizedPhone,
      cognitoSub: { $ne: req.user.cognitoSub },
    });

    if (existingCustomer) {
      return res.status(409).json({ message: 'Phone number already in use' });
    }

    const customer = await ensureCustomerProfile({
      ...req.user,
      phone: normalizedPhone,
    });

    customer.phone = normalizedPhone;
    customer.location = { type: 'Point', coordinates, address };
    customer.profileComplete = true;
    await customer.save();

    res.json(customer);
  } catch (err) {
    const status = err.message?.includes('already registered') || err.message?.includes('already in use') ? 409 : 500;
    res.status(status).json({ message: err.message });
  }
};
