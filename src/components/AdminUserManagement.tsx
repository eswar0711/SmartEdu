import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User } from '../utils/supabaseClient';
import NavigationSidebar from './NavigationSidebar';
import {
  Trash2,
  Lock,
  Unlock,
  
  Search,
  
} from 'lucide-react';

interface AdminUserManagementProps {
  user: User;
}

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'faculty' | 'admin';
  is_blocked: boolean;
  is_active: boolean;
  created_at: string;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ user }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'faculty' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      console.log('👥 Fetching all users...');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
        return;
      }

      setUsers(data || []);
      console.log('✓ Loaded', data?.length || 0, 'users');
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        u =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => !u.is_blocked && u.is_active);
    } else if (statusFilter === 'blocked') {
      filtered = filtered.filter(u => u.is_blocked);
    }

    setFilteredUsers(filtered);
  };

  const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      const newStatus = !currentStatus;

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_blocked: newStatus })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error:', error);
        alert('Failed to update user status');
        return;
      }

      console.log(`✓ User ${newStatus ? 'blocked' : 'unblocked'}`);
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: 'student' | 'faculty' | 'admin') => {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error:', error);
        alert('Failed to change role');
        return;
      }

      console.log(`✓ User role changed to ${newRole}`);
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;

    try {
      setActionLoading(true);

      // Delete from user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Error:', profileError);
        alert('Failed to delete user');
        return;
      }

      // Delete from auth (requires admin API)
      console.log('✓ User deleted from system');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">User Management</h2>
          <p className="text-gray-600">View and manage all users in the system</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-800">{u.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {u.is_blocked ? (
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Actions Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedUser.full_name}</h3>

            <div className="space-y-2 mb-6 text-sm text-gray-600">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Status:</strong> {selectedUser.is_blocked ? 'Blocked' : 'Active'}</p>
            </div>

            <div className="space-y-3">
              {/* Change Role */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Change Role</label>
                <select
                  defaultValue={selectedUser.role}
                  onChange={(e) => changeUserRole(selectedUser.id, e.target.value as any)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Block/Unblock */}
              <button
                onClick={() => toggleBlockUser(selectedUser.id, selectedUser.is_blocked)}
                disabled={actionLoading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  selectedUser.is_blocked
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {selectedUser.is_blocked ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unblock User
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Block User
                  </>
                )}
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteUser(selectedUser.id)}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>
            </div>

            {/* Close */}
            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
