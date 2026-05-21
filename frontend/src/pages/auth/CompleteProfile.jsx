import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client.js';

export default function CompleteProfile() {
  const [phone, setPhone]       = useState('');
  const [address, setAddress]   = useState('');
  const [coords, setCoords]     = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  const pinLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setLocating(false);
      },
      () => { alert('Could not get location'); setLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.put('/api/auth/complete-profile', {
        phone,
        address,
        coordinates: coords || [0, 0],
      });
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            We need your phone number and location to process orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            placeholder="Phone number e.g. 0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            required
          />
          <input
            placeholder="Area / Address in Narok"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            required
          />
          <button
            type="button"
            onClick={pinLocation}
            className="w-full border border-blue-500 text-blue-500 py-3 rounded-xl"
          >
            {locating ? 'Getting location...' : coords ? '✓ Location Pinned' : '📍 Pin My Location'}
          </button>
          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
