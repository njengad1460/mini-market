import { useState, useRef } from 'react';
import { createSpecialOrder } from '../../api/specialOrders.js';
import { uploadProfileImage } from '../../api/customers.js';
import useToastStore from '../../store/toastStore.js';

export default function RequestForm({ shoes = [], onSuccess }) {
  const toast = useToastStore((s) => s.show);
  const [mode, setMode] = useState('photo');
  const [formData, setFormData] = useState({
    photoUrl: '',
    productId: '',
    productName: '',
    requestedSize: '',
    requestedColor: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, photoUrl: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.photoUrl;

      if (photoFile && mode === 'photo') {
        const uploadResponse = await uploadProfileImage(photoFile);
        photoUrl = uploadResponse.profileImage;
      }

      const submitData = {
        description: formData.description?.trim() || '',
      };

      if (mode === 'photo' && photoUrl) {
        submitData.photoUrl = photoUrl;
      } else if (mode === 'product') {
        if (formData.productId) {
          submitData.productId = formData.productId;
        } else if (formData.productName) {
          submitData.productName = formData.productName;
        }
        submitData.requestedSize = formData.requestedSize.trim();
        if (formData.requestedColor) {
          submitData.requestedColor = formData.requestedColor.trim();
        }
      }

      if (!submitData.photoUrl && !submitData.productId && !submitData.productName) {
        return toast('Please provide a photo or select a product', 'error');
      }

      await createSpecialOrder(submitData);
      toast('Special request submitted!');
      setFormData({
        photoUrl: '',
        productId: '',
        productName: '',
        requestedSize: '',
        requestedColor: '',
        description: '',
      });
      setPhotoFile(null);
      onSuccess?.();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-4">Request a Special Shoe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('photo')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
              mode === 'photo'
                ? 'bg-[#265f2e] text-[#fffdf8]'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📸 Photo Request
          </button>
          <button
            type="button"
            onClick={() => setMode('product')}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
              mode === 'product'
                ? 'bg-[#265f2e] text-[#fffdf8]'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            👟 Product Request
          </button>
        </div>

        {mode === 'photo' ? (
          <>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#265f2e]"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.photoUrl ? (
                <div>
                  <img
                    src={formData.photoUrl}
                    alt="preview"
                    className="max-h-64 mx-auto rounded-lg mb-3"
                  />
                  <p className="text-sm text-gray-600">Click to change photo</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-2">📸</p>
                  <p className="text-gray-700 font-semibold">Click to upload a photo</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Select from Inventory</label>
              <select
                value={formData.productId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    productId: e.target.value,
                    productName: '',
                  }))
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">-- Choose a product --</option>
                {shoes.map((shoe) => (
                  <option key={shoe._id} value={shoe._id}>
                    {shoe.name} ({shoe.brand})
                  </option>
                ))}
              </select>
            </div>

            {!formData.productId && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Or enter product name</label>
                <input
                  type="text"
                  placeholder="e.g., Nike Air Force 1"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, productName: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Size *</label>
              <input
                type="text"
                placeholder="e.g., 42"
                value={formData.requestedSize}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requestedSize: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Color (optional)</label>
              <input
                type="text"
                placeholder="e.g., Black"
                value={formData.requestedColor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requestedColor: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Additional Notes</label>
          <textarea
            placeholder="Any additional details about your request..."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full rounded-lg border px-3 py-2 h-24"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#265f2e] text-[#fffdf8] py-3 rounded-lg font-semibold hover:bg-[#1a4620] disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
