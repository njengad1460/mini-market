import Shoe from '../models/Shoe.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { signImageList } from '../services/s3Service.js';

const attachSignedImages = async (shoe) => {
  if (!shoe) return shoe;

  const serialized = typeof shoe.toObject === 'function' ? shoe.toObject() : shoe;
  return {
    ...serialized,
    images: await signImageList(serialized.images || []),
  };
};

// Staff or admin adds a product (staff → pending, admin → active)
export const addProduct = async (req, res) => {
  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    if (!staff) {
      return res.status(401).json({ message: 'User not found in database. Please log out and log back in to sync your account.' });
    }
    const status = req.user.role === 'admin' ? 'active' : 'pending';

    const shoe = await Shoe.create({ ...req.body, addedBy: staff._id, status });

    await AuditLog.create({
      actor:       staff._id,
      action:      'ADD_PRODUCT',
      targetModel: 'Shoe',
      targetId:    shoe._id,
      diff:        { after: req.body },
    });

    res.status(201).json(await attachSignedImages(shoe));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approves a pending product
export const approveProduct = async (req, res) => {
  try {
    const admin = await User.findOne({ cognitoSub: req.user.cognitoSub });
    if (!admin) {
      return res.status(401).json({ message: 'User not found in database. Please log out and log back in to sync your account.' });
    }
    const shoe  = await Shoe.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });

    await AuditLog.create({
      actor:       admin._id,
      action:      'APPROVE_PRODUCT',
      targetModel: 'Shoe',
      targetId:    shoe._id,
      diff:        { before: { status: 'pending' }, after: { status: 'active' } },
    });

    res.json(await attachSignedImages(shoe));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public — list active products, hide costPrice
export const getProducts = async (req, res) => {
  try {
    const shoes = await Shoe.find({ status: 'active' }).select('-costPrice');
    res.json(await Promise.all(shoes.map(attachSignedImages)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin only — includes costPrice
export const getProductsAdmin = async (req, res) => {
  try {
    const query = Shoe.find().populate('addedBy', 'name');

    if (req.user.role !== 'admin') {
      query.select('-costPrice');
    }

    const shoes = await query;
    res.json(await Promise.all(shoes.map(attachSignedImages)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Single product — public, no costPrice
export const getProduct = async (req, res) => {
  try {
    const shoe = await Shoe.findById(req.params.id).select('-costPrice');
    if (!shoe) return res.status(404).json({ message: 'Product not found' });
    res.json(await attachSignedImages(shoe));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff/admin updates stock per size
export const updateProduct = async (req, res) => {
  try {
    const staff = await (await import('../models/User.js')).default.findOne({ cognitoSub: req.user.cognitoSub });
    if (!staff) {
      return res.status(401).json({ message: 'User not found in database. Please log out and log back in to sync your account.' });
    }
    const before = await Shoe.findById(req.params.id);
    const shoe   = await Shoe.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await (await import('../models/AuditLog.js')).default.create({
      actor:       staff._id,
      action:      'UPDATE_PRODUCT',
      targetModel: 'Shoe',
      targetId:    shoe._id,
      diff:        { before: before.toObject(), after: shoe.toObject() },
    });

    res.json(await attachSignedImages(shoe));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
