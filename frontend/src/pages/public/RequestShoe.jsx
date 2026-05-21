import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../../api/client.js';
import useAuthStore from '../../store/authStore.js';

export default function RequestShoe() {
  const { isAuthenticated, role } = useAuthStore();
  const [searchParams] = useSearchParams();
  const soldOutRequest = useMemo(() => ({
    productId: searchParams.get('productId') || '',
    productName: searchParams.get('productName') || '',
  }), [searchParams]);
  const isSoldOutRequest = Boolean(soldOutRequest.productId || soldOutRequest.productName);
  const [description, setDescription] = useState('');
  const [file, setFile]               = useState(null);
  const [size, setSize]               = useState(searchParams.get('size') || '');
  const [color, setColor]             = useState(searchParams.get('color') || '');
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl;

      if (!isSoldOutRequest) {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        const { data: { url } } = await client.post('/api/upload', formData);
        photoUrl = url;
      }

      await client.post('/api/special-orders', {
        photoUrl,
        description,
        productId: soldOutRequest.productId,
        productName: soldOutRequest.productName,
        requestedSize: size,
        requestedColor: color,
      });
      setSubmitted(true);
    } catch {
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted)
    return (
      <div className="p-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="font-semibold mt-2">Request submitted!</p>
        <p className="text-gray-500 text-sm mt-1">Our staff will review and get back to you.</p>
      </div>
    );

  if (!isAuthenticated || role !== 'customer') {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Request via WhatsApp</h1>
        <p className="text-gray-500 mb-6">
          You need an account to track special requests here. For quick requests, you can contact us directly on WhatsApp!
        </p>
        <button
          onClick={() => {
            const msg = isSoldOutRequest
              ? `Hi, I would like to request the sold out shoe: ${soldOutRequest.productName}`
              : 'Hi, I would like to make a special shoe request.';
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-lg"
        >
          Message on WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Request a Shoe</h1>
      <p className="text-gray-500 text-sm mb-6">
        {isSoldOutRequest
          ? `Request ${soldOutRequest.productName || 'this shoe'} in the size and color you want.`
          : "Can't find what you're looking for? Upload a photo and we'll source it for you."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSoldOutRequest ? (
          <div className="rounded-xl border bg-[#f7f6f2] px-4 py-3 text-sm">
            <p className="font-semibold">{soldOutRequest.productName}</p>
            <p className="text-gray-500 mt-1">This shoe is sold out, but we can source it for you as a special order.</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Shoe Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border rounded-xl px-3 py-2 text-sm"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Size</label>
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="e.g. 42"
            className="w-full border rounded-xl px-3 py-2 text-sm"
            required={isSoldOutRequest}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Color (optional)</label>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Black"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description {isSoldOutRequest ? '(optional)' : '(optional)'}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isSoldOutRequest ? 'Any extra details for the team' : 'e.g. Black Nike Air Force size 42, for men'}
            rows={3}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!isSoldOutRequest && !file) || (isSoldOutRequest && !size.trim())}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
