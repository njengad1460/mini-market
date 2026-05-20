import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Cart from '../models/Cart.js';
import { applyReferralBonus } from './customerController.js';
import { ensureOrderItemsInStock, deductStockForOrder } from '../services/stockService.js';

const getNetTotal = (order) => Math.max(
  (order.totalAmount || 0) - (order.walletDiscount || 0) - (order.manualDiscount || 0),
  0
);

const canAccessOrder = (req, order, customer) => {
  if (!req.user) return false;
  if (req.user.role === 'admin' || req.user.role === 'staff') return true;
  if (req.user.role === 'customer' && customer?._id && order.customer) {
    return order.customer.toString() === customer._id.toString();
  }
  return false;
};

// Place a new order
export const placeOrder = async (req, res) => {
  const { guestPhone, items, paymentType, orderType, walletDiscount } = req.body;

  try {
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }

    await ensureOrderItemsInStock(items);

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

    const qualifyingTotal = Math.max(totalAmount - (walletDiscount || 0), 0);

    // trigger referral bonus once when the referred customer's qualifying order is above 999
    if (qualifyingTotal > 999 && customer?._id) {
      await applyReferralBonus(customer._id, order._id);
    }

    const cartFilter = customer?._id
      ? { customer: customer._id }
      : (req.headers['x-session-id'] ? { sessionId: req.headers['x-session-id'] } : null);
    if (cartFilter) {
      await Cart.deleteOne(cartFilter);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email shoeBalance walletBalance')
      .populate('items.shoe', 'name images')
      .populate('deliveries.deliveredBy', 'name')
      .populate('discountBy', 'name role');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const customer = req.user.role === 'customer'
      ? await Customer.findOne({ cognitoSub: req.user.cognitoSub })
      : null;

    if (!canAccessOrder(req, order, customer)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pay an installment on a credit order
export const payInstallment = async (req, res) => {
  const { amount, reference, paymentMethod } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentType !== 'credit') {
      return res.status(400).json({ message: 'Installments can only be recorded for credit orders' });
    }
    if (!['cash', 'mpesa'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Payment method must be cash or mpesa' });
    }

    const customer = req.user.role === 'customer'
      ? await Customer.findOne({ cognitoSub: req.user.cognitoSub })
      : null;

    if (!canAccessOrder(req, order, customer)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    const remainingBeforePayment = getNetTotal(order) - (order.paidAmount || 0);
    if (remainingBeforePayment <= 0) {
      return res.status(400).json({ message: 'This order is already fully paid' });
    }
    if (numericAmount > remainingBeforePayment) {
      return res.status(400).json({ message: `Amount exceeds remaining balance of Ksh ${remainingBeforePayment}` });
    }

    order.installments.push({
      amount: numericAmount,
      paymentMethod,
      reference: reference?.trim() || '',
    });
    order.paidAmount += numericAmount;
    await order.save();

    const actor = await User.findOne({ cognitoSub: req.user.cognitoSub });
    if (actor?._id) {
      await AuditLog.create({
        actor:       actor._id,
        action:      'RECORD_INSTALLMENT_PAYMENT',
        targetModel: 'Order',
        targetId:    order._id,
        diff:        {
          before: { paidAmount: order.paidAmount - numericAmount },
          after:  { paidAmount: order.paidAmount, amount: numericAmount, paymentMethod, reference: reference?.trim() || '' },
        },
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email shoeBalance walletBalance')
      .populate('items.shoe', 'name images')
      .populate('deliveries.deliveredBy', 'name')
      .populate('discountBy', 'name role');

    res.json(populatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const completeOrder = async (req, res) => {
  const { paymentMethod, reference } = req.body;

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Order is already completed' });
    }
    if (order.paymentType === 'credit' && order.orderType === 'direct') {
      return res.status(400).json({ message: 'Direct credit orders should be completed through left/right delivery tracking' });
    }

    const remainingBalance = Math.max(getNetTotal(order) - (order.paidAmount || 0), 0);
    if (remainingBalance > 0) {
      if (!['cash', 'mpesa'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Payment method must be cash or mpesa to complete this sale' });
      }
      order.installments.push({
        amount: remainingBalance,
        paymentMethod,
        reference: reference?.trim() || '',
      });
      order.paidAmount += remainingBalance;
    }

    order.status = 'delivered';
    await deductStockForOrder(order);

    await AuditLog.create({
      actor:       staff._id,
      action:      'COMPLETE_ORDER',
      targetModel: 'Order',
      targetId:    order._id,
      diff:        {
        after: {
          status: order.status,
          paidAmount: order.paidAmount,
          paymentMethod: paymentMethod || null,
          reference: reference?.trim() || '',
        },
      },
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email shoeBalance walletBalance')
      .populate('items.shoe', 'name images')
      .populate('deliveries.deliveredBy', 'name')
      .populate('discountBy', 'name role');

    res.json(populatedOrder);
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
    if (order.paymentType === 'full' || order.orderType === 'sample_request') {
      return res.status(400).json({ message: 'Left/right delivery tracking is only available for direct credit orders' });
    }

    order.deliveries.push({ shoe, deliveredBy: staff._id, location });

    // update status
    const delivered = order.deliveries.map((d) => d.shoe);
    if (delivered.includes('left') && delivered.includes('right')) {
      order.status = 'delivered';
    } else {
      order.status = 'partial_delivered';
    }

    if (order.status === 'delivered') {
      await deductStockForOrder(order);
    } else {
      await order.save();
    }

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
    const numericDiscount = Number(discount);
    if (!Number.isFinite(numericDiscount) || numericDiscount < 0) {
      return res.status(400).json({ message: 'Discount must be zero or greater' });
    }

    const orderBefore = await Order.findById(req.params.id);
    if (!orderBefore) return res.status(404).json({ message: 'Order not found' });
    if (orderBefore.status === 'delivered') {
      return res.status(400).json({ message: 'Completed orders cannot be discounted' });
    }

    const maxDiscount = Math.max((orderBefore.totalAmount || 0) - (orderBefore.walletDiscount || 0), 0);
    if (numericDiscount > maxDiscount) {
      return res.status(400).json({ message: `Discount cannot exceed Ksh ${maxDiscount}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { manualDiscount: numericDiscount, discountBy: staff._id },
      { new: true }
    );

    await AuditLog.create({
      actor:       staff._id,
      action:      'APPLY_DISCOUNT',
      targetModel: 'Order',
      targetId:    order._id,
      diff:        { before: { manualDiscount: orderBefore.manualDiscount || 0 }, after: { manualDiscount: numericDiscount } },
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
      .populate('customer', 'name phone email shoeBalance walletBalance')
      .populate('items.shoe', 'name')
      .populate('deliveries.deliveredBy', 'name')
      .populate('discountBy', 'name role')
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
      .populate('deliveries.deliveredBy', 'name')
      .populate('discountBy', 'name role')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
