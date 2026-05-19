import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { applyReferralBonus } from './customerController.js';

// Place a new order
export const placeOrder = async (req, res) => {
  const { guestPhone, items, paymentType, orderType, walletDiscount } = req.body;

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    let customer = null;
    if (req.user?.cognitoSub) {
      customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
      if (req.user.role === 'customer' && !customer) {
        return res.status(409).json({ message: 'Customer profile not ready yet. Please try again.' });
      }
    }

    const normalizedGuestPhone = guestPhone?.trim();
    if (!customer && !normalizedGuestPhone) {
      return res.status(400).json({ message: 'Guest phone number is required' });
    }

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      customer:      customer?._id,
      guestPhone:    customer ? undefined : normalizedGuestPhone,
      items,
      orderType:     orderType || 'direct',
      paymentType:   paymentType || 'full',
      totalAmount,
      walletDiscount: walletDiscount || 0,
    });

    // deduct wallet discount from customer balance
    if (walletDiscount && customer?._id) {
      await Customer.findByIdAndUpdate(customer._id, { $inc: { walletBalance: -walletDiscount } });
    }

    // trigger referral bonus if order > 999
    if (totalAmount > 999 && customer?._id) {
      await applyReferralBonus(customer._id);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pay an installment on a credit order
export const payInstallment = async (req, res) => {
  const { amount, reference } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.installments.push({ amount, reference });
    order.paidAmount += amount;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff records a partial delivery (left or right shoe)
export const recordDelivery = async (req, res) => {
  const { shoe, location } = req.body; // shoe: 'left' | 'right'

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.deliveries.push({ shoe, deliveredBy: staff._id, location });

    // update status
    const delivered = order.deliveries.map((d) => d.shoe);
    if (delivered.includes('left') && delivered.includes('right')) {
      order.status = 'delivered';
    } else {
      order.status = 'partial_delivered';
    }

    await order.save();

    await AuditLog.create({
      actor:       staff._id,
      action:      'RECORD_DELIVERY',
      targetModel: 'Order',
      targetId:    order._id,
      diff:        { after: { shoe, deliveredBy: staff._id, location } },
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Staff applies a manual discount
export const applyDiscount = async (req, res) => {
  const { discount } = req.body;

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { manualDiscount: discount, discountBy: staff._id },
      { new: true }
    );

    await AuditLog.create({
      actor:       staff._id,
      action:      'APPLY_DISCOUNT',
      targetModel: 'Order',
      targetId:    order._id,
      diff:        { after: { manualDiscount: discount } },
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all orders — staff and admin
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name phone')
      .populate('items.shoe', 'name')
      .populate('deliveries.deliveredBy', 'name')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Customer views their own orders
export const getMyOrders = async (req, res) => {
  try {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
    if (!customer) return res.json([]);

    const orders   = await Order.find({ customer: customer._id })
      .populate('items.shoe', 'name images')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
