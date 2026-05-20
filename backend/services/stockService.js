import Shoe from '../models/Shoe.js';

export const ensureOrderItemsInStock = async (items) => {
  for (const item of items || []) {
    const shoe = await Shoe.findById(item.shoe);
    if (!shoe || shoe.status !== 'active') {
      throw new Error('One of the selected shoes is no longer available');
    }

    const sizeEntry = (shoe.sizes || []).find((size) => size.size === item.size);
    if (!sizeEntry || (sizeEntry.stock || 0) < (item.quantity || 0)) {
      throw new Error(`${shoe.name} size ${item.size} is out of stock`);
    }
  }
};

export const deductStockForOrder = async (order) => {
  if (!order || order.stockDeductedAt) return order;

  for (const item of order.items || []) {
    const shoe = await Shoe.findById(item.shoe);
    if (!shoe) {
      throw new Error('A shoe in this order no longer exists');
    }

    const sizeEntry = (shoe.sizes || []).find((size) => size.size === item.size);
    if (!sizeEntry || (sizeEntry.stock || 0) < (item.quantity || 0)) {
      throw new Error(`${shoe.name} size ${item.size} does not have enough stock`);
    }

    sizeEntry.stock -= item.quantity || 0;
    await shoe.save();
  }

  order.stockDeductedAt = new Date();
  await order.save();
  return order;
};
