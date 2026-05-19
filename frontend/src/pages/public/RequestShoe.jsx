import { useState } from 'react';
import client from '../../api/client.js';

export default function RequestShoe() {
  const [description, setDescription] = useState('');
  const [file, setFile]               = useState(null);
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    try {
      // upload image to S3 via backend presigned URL then submit special order
      const formData = new FormData();
      formData.append('file', file);
      const { data: { url } } = await client.post('/api/upload', formData);

      await client.post('/api/special-orders', { photoUrl: url, description });
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Request a Shoe</h1>
      <p className="text-gray-500 text-sm mb-6">
        Can't find what you're looking for? Upload a photo and we'll source it for you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Black Nike Air Force size 42, for men"
            rows={3}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
