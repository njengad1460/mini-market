import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { useToastStore } from '../../components/Toast.jsx';

const roleColors = {
  admin:    'bg-purple-100 text-purple-700',
  staff:    'bg-blue-100 text-blue-700',
  customer: 'bg-green-100 text-green-700',
};

const statusColors = {
  CONFIRMED:   'bg-green-100 text-green-700',
  UNCONFIRMED: 'bg-yellow-100 text-yellow-700',
  FORCE_CHANGE_PASSWORD: 'bg-orange-100 text-orange-700',
};

export default function UserManagementPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const toast                 = useToastStore((s) => s.show);

  const fetchUsers = () =>
    client.get('/api/users').then(r => { setUsers(r.data); setLoading(false); });

  useEffect(() => { fetchUsers(); }, []);

  const handleAssignRole = async (username, role) => {
    try {
      await client.post('/api/users/assign-role', { username, role });
      toast(`Role updated to ${role} ✓`);
      fetchUsers();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleToggle = async (username, enabled) => {
    try {
      await client.patch(`/api/users/${username}/${enabled ? 'disable' : 'enable'}`);
      toast(`User ${enabled ? 'disabled' : 'enabled'} ✓`);
      fetchUsers();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="p-8 text-center text-gray-400">Loading users...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {['admin', 'staff', 'customer'].map((role) => (
          <div key={role} className="border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">
              {users.filter(u => u.role === role).length}
            </p>
            <p className="text-xs text-gray-500 capitalize">{role}s</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-2 text-sm min-w-[200px]"
        />
        <div className="flex gap-2">
          {['all', 'admin', 'staff', 'customer'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs border capitalize ${
                filter === f ? 'bg-black text-white border-black' : ''
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* user list */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <div
            key={u.username}
            className={`border rounded-xl p-4 ${!u.enabled ? 'opacity-50' : ''}`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{u.name || 'No name'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>
                    {u.role}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[u.status] || 'bg-gray-100 text-gray-500'}`}>
                    {u.status}
                  </span>
                  {!u.enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      disabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
                {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                <p className="text-xs text-gray-400">
                  Joined: {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* role selector */}
                <select
                  value={u.role}
                  onChange={(e) => handleAssignRole(u.username, e.target.value)}
                  className="border rounded-lg px-2 py-1 text-xs"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>

                {/* enable/disable toggle */}
                <button
                  onClick={() => handleToggle(u.username, u.enabled)}
                  className={`text-xs px-3 py-1 rounded-lg border ${
                    u.enabled
                      ? 'border-red-300 text-red-500 hover:bg-red-50'
                      : 'border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {u.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No users found</p>
        )}
      </div>
    </div>
  );
}
