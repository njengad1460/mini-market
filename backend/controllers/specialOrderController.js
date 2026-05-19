import SpecialOrder from '../models/SpecialOrder.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { notifyStaff } from '../services/whatsappService.js';

export const createSpecialOrder = async (req, res) => {
  const { photoUrl, description } = req.body;

  try {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });

    const order = await SpecialOrder.create({
      customer:    customer._id,
      photoUrl,
      description,
    });

    // notify all staff via WhatsApp
    const staffList = await User.find({ role: 'staff' }, 'phone');
    const phones    = staffList.map((s) => s.phone);
    await notifyStaff(phones, `New shoe upload from ${customer.name}: ${description || 'No description'}`);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSpecialOrders = async (req, res) => {
  try {
    const orders = await SpecialOrder.find()
      .populate('customer', 'name phone')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSpecialOrderStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const order = await SpecialOrder.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: staff._id },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
