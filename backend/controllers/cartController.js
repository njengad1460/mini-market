import Cart from '../models/Cart.js';
import Customer from '../models/Customer.js';

const getCartFilter = async (req) => {
  // req.user is set by optionalAuth middleware if token is present
  if (req.user?.cognitoSub) {
    const customer = await Customer.findOne({ cognitoSub: req.user.cognitoSub });
    if (customer) return { customer: customer._id };
  }
  // fallback to guest session
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) throw new Error('No session id provided');
  return { sessionId };
};

export const getCart = async (req, res) => {
  try {
    const filter = await getCartFilter(req);
    const cart   = await Cart.findOne(filter).populate('items.shoe', 'name price images');
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addToCart = async (req, res) => {
  const { shoeId, size, quantity } = req.body;
  if (!shoeId || !size) return res.status(400).json({ message: 'shoeId and size are required' });

  try {
    const filter = await getCartFilter(req);
    let cart     = await Cart.findOne(filter);
    if (!cart) cart = await Cart.create({ ...filter, items: [] });

    const existing = cart.items.find(
      (i) => i.shoe.toString() === shoeId && i.size === size
    );

    if (existing) existing.quantity += quantity || 1;
    else cart.items.push({ shoe: shoeId, size, quantity: quantity || 1 });

    await cart.save();
    await cart.populate('items.shoe', 'name price images');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeFromCart = async (req, res) => {
  const { shoeId, size } = req.body;

  try {
    const filter = await getCartFilter(req);
    const cart   = await Cart.findOne(filter);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(
      (i) => !(i.shoe.toString() === shoeId && i.size === size)
    );

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const whatsappCheckout = async (req, res) => {
  const { businessPhone, guestPhone } = req.body;
  const sessionId = req.headers['x-session-id'];

  try {
    const cart = await Cart.findOne({ sessionId }).populate('items.shoe', 'name price');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const lines   = cart.items.map(
      (i) => `• ${i.shoe.name} (Size: ${i.size}) x${i.quantity} = Ksh ${i.shoe.price * i.quantity}`
    );
    const total   = cart.items.reduce((s, i) => s + i.shoe.price * i.quantity, 0);
    const message = `Hello! I'd like to order:\n${lines.join('\n')}\nTotal: Ksh ${total}\nMy phone: ${guestPhone}`;

    res.json({ waLink: `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
