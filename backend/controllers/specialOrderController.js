import SpecialOrder from '../models/SpecialOrder.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { notifyStaff } from '../services/whatsappService.js';

export const createSpecialOrder = async (req, res) => {
  const { photoUrl, description, productId, productName, requestedSize, requestedColor } = req.body;

  try {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
    if (!customer) return res.status(404).json({ message: 'Customer profile not found' });
    if (!photoUrl && !productId && !productName) {
      return res.status(400).json({ message: 'Provide a photo or choose a sold out shoe to request' });
    }
    if ((productId || productName) && !requestedSize?.trim()) {
      return res.status(400).json({ message: 'Size is required for sold out shoe requests' });
    }

    const order = await SpecialOrder.create({
      customer:    customer._id,
      photoUrl,
      product: productId || undefined,
      productName: productName?.trim() || undefined,
      requestedSize: requestedSize?.trim() || undefined,
      requestedColor: requestedColor?.trim() || undefined,
      description,
    });

    // notify all staff via WhatsApp
    const staffList = await User.find({ role: 'staff' }, 'phone');
    const phones    = staffList.map((s) => s.phone);
    const summary = productName
      ? `${productName} size ${requestedSize}${requestedColor?.trim() ? `, color ${requestedColor.trim()}` : ''}`
      : description || 'No description';
    await notifyStaff(phones, `New shoe request from ${customer.name}: ${summary}`);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSpecialOrders = async (req, res) => {
  try {
    const orders = await SpecialOrder.find()
      .populate('customer', 'name phone')
      .populate('product', 'name')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMySpecialOrders = async (req, res) => {
  try {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
    if (!customer) return res.json([]);

    const orders = await SpecialOrder.find({ customer: customer._id })
      .populate('reviewedBy', 'name')
      .populate('product', 'name')
      .sort('-createdAt');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSpecialOrderStatus = async (req, res) => {
  const { status, quotedAmount, depositPaid, depositPaymentMethod } = req.body;

  try {
    const staff = await User.findOne({ cognitoSub: req.user.cognitoSub });
    const order = await SpecialOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Special order not found' });

    if (quotedAmount !== undefined) {
      const numericAmount = Number(quotedAmount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: 'Quoted amount must be greater than zero' });
      }

      order.quotedAmount = numericAmount;
      order.requiredDeposit = Math.ceil(numericAmount * 0.5);
      if (order.status === 'pending') {
        order.status = 'awaiting_deposit';
      }
    }

    if (depositPaid === true) {
      if (!order.quotedAmount || !order.requiredDeposit) {
        return res.status(400).json({ message: 'Set the shoe amount before recording deposit payment' });
      }
      if (!['cash', 'mpesa'].includes(depositPaymentMethod)) {
        return res.status(400).json({ message: 'Deposit payment method must be cash or mpesa' });
      }

      order.depositPaid = true;
      order.depositPaidAt = new Date();
      order.depositPaymentMethod = depositPaymentMethod;
      if (order.status === 'awaiting_deposit' || order.status === 'pending') {
        order.status = 'ordered';
      }
    }

    if (status) {
      if (status === 'ordered' && !order.depositPaid) {
        return res.status(400).json({ message: 'Record the 50% deposit before marking this special order as ordered' });
      }
      order.status = status;
    }

    order.reviewedBy = staff._id;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
