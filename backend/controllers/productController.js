import Shoe from '../models/Shoe.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// Staff or admin adds a product (staff → pending, admin → active)
export const addProduct = async (req, res) => {
  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const status = req.user.role === 'admin' ? 'active' : 'pending';

    const shoe = await Shoe.create({ ...req.body, addedBy: staff._id, status });

    await AuditLog.create({
      actor:       staff._id,
      action:      'ADD_PRODUCT',
      targetModel: 'Shoe',
      targetId:    shoe._id,
      diff:        { after: req.body },
    });

    res.status(201).json(shoe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approves a pending product
export const approveProduct = async (req, res) => {
  try {
    const admin = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const shoe  = await Shoe.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });

    await AuditLog.create({
      actor:       admin._id,
      action:      'APPROVE_PRODUCT',
      targetModel: 'Shoe',
      targetId:    shoe._id,
      diff:        { before: { status: 'pending' }, after: { status: 'active' } },
    });

    res.json(shoe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public — list active products, hide costPrice
export const getProducts = async (req, res) => {
  try {
    const shoes = await Shoe.find({ status: 'active' }).select('-costPrice');
    res.json(shoes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin only — includes costPrice
export const getProductsAdmin = async (req, res) => {
  try {
    const shoes = await Shoe.find().populate('addedBy', 'name');
    res.json(shoes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Single product — public, no costPrice
export const getProduct = async (req, res) => {
  try {
    const shoe = await Shoe.findById(req.params.id).select('-costPrice');
    if (!shoe) return res.status(404).json({ message: 'Product not found' });
    res.json(shoe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff/admin updates stock per size
export const updateProduct = async (req, res) => {
  try {
    const staff = await (await import('../models/User.js')).default.findOne({ cognitoSub: req.user.cognitoSub });
    const before = await Shoe.findById(req.params.id);
    const shoe   = await Shoe.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await (await import('../models/AuditLog.js')).default.create({
      actor:       staff._id,
      action:      'UPDATE_PRODUCT',
      targetModel: 'Shoe',
      targetId:    shoe._id,
      diff:        { before: before.toObject(), after: shoe.toObject() },
    });

    res.json(shoe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
