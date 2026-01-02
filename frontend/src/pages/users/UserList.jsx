import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, User, Trash2, Pencil, Shield, ShieldAlert } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [editingUser, setEditingUser] = useState(null); 
  const [formData, setFormData] = useState({ email: '', fullName: '', password: '', role: 'user' });

  // Get User Data
  const getUserData = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return {};
    try { return JSON.parse(userString).user || JSON.parse(userString); } 
    catch (e) { return {}; }
  };

  const currentUser = getUserData();
  const tenantId = currentUser.tenantId || currentUser.tenant_id;
  const isSuperAdmin = currentUser.role === 'super_admin';
  const token = localStorage.getItem('token');

  // 1. Fetch Users
  const fetchUsers = async () => {
    // If not Super Admin AND no Tenant ID, stop.
    if (!isSuperAdmin && !tenantId) return;

    try {
      // Logic: Super Admin uses /api/users, Tenant Admin uses /api/tenants/:id/users
      const url = isSuperAdmin 
        ? `/users` 
        : `/tenants/${tenantId}/users`;

      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tenantId, isSuperAdmin]);

  // 2. Open Modal Logic
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', fullName: '', password: '', role: 'user' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ 
      email: user.email, 
      fullName: user.full_name, 
      password: '', 
      role: user.role 
    });
    setIsModalOpen(true);
  };

  // 3. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!isSuperAdmin && !tenantId) {
        alert("Error: Missing Tenant ID");
        setLoading(false);
        return;
    }

    // Determine target ID (For Super Admin creating users, we need logic, but for now we focus on Tenant Admin)
    // If Super Admin creates a user, they usually need to select a tenant. 
    // This simple UI assumes creating in CURRENT context.
    const targetUrlId = isSuperAdmin ? (editingUser?.tenant_id || tenantId) : tenantId;

    try {
      const urlBase = `/tenants/${targetUrlId}/users`;
      
      if (editingUser) {
        await api.put(`${urlBase}/${editingUser.id}`, 
          { fullName: formData.fullName, role: formData.role },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('User updated');
      } else {
        await api.post(urlBase, formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('User added');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Delete
  const handleDelete = async (user) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      // Use the user's specific tenant_id for the delete URL if available (Super Admin view)
      const targetTId = user.tenant_id || tenantId;
      await api.delete(`/tenants/${targetTId}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-vite-text">
          {isSuperAdmin ? 'All System Users' : 'Team Members'}
        </h2>
        
        {/* Hide Add button for Super Admin in this simple view to prevent complexity */}
        {!isSuperAdmin && (
          <button onClick={openCreateModal} className="flex items-center bg-gradient-to-r from-[#646cff] via-[#535bf2] to-[#f97316] text-white px-4 py-2 rounded-md hover:shadow-md transition-all">
            <Plus className="w-4 h-4 mr-2" /> Add User
          </button>
        )}
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {isSuperAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role.includes('admin') ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                {isSuperAdmin && (
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {user.tenant_name || 'N/A'}
                   </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-900 p-2 mr-2">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Edit User" : "Invite User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={formData.fullName} required onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
          <Input label="Email" type="email" value={formData.email} required disabled={!!editingUser} className={editingUser ? "bg-gray-100" : ""} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          {!editingUser && (
            <Input label="Password" type="password" value={formData.password} required onChange={(e) => setFormData({...formData, password: e.target.value})} />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="user">Regular User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;