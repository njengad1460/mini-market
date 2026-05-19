import { Link } from 'react-router-dom';

export default function OrderSuccess() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
      <p className="text-5xl">🎉</p>
      <h1 className="text-2xl font-bold">Order Placed!</h1>
      <p className="text-gray-500 max-w-xs">
        Your order has been received. Our team will contact you shortly for delivery.
      </p>
      <Link to="/" className="bg-black text-white px-6 py-3 rounded-xl font-semibold">
        Continue Shopping
      </Link>
    </div>
  );
}
