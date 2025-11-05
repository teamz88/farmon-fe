import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  Eye,
  Building,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  Crown,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserListItem, UsersListStats } from '../types/analytics';
import CompanyInfoDetailsModal from '../components/CompanyInfoDetailsModal';
import UserProfileModal from '../components/UserProfileModal';

dayjs.extend(relativeTime);

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    subscription_type: '',
    subscription_status: '',
    is_active: ''
  });

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: UserListItem | null;
  }>({ isOpen: false, user: null });

  const [companyInfoModal, setCompanyInfoModal] = useState<{
    isOpen: boolean;
    user: UserListItem | null;
    companyInfo?: any;
  }>({ isOpen: false, user: null });

  const [userProfileModal, setUserProfileModal] = useState<{
    isOpen: boolean;
    user: UserListItem | null;
  }>({ isOpen: false, user: null });

  const [roleChangeModal, setRoleChangeModal] = useState<{
    isOpen: boolean;
    user: UserListItem | null;
    newRole: string;
  }>({ isOpen: false, user: null, newRole: '' });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => authApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      console.log('User deleted successfully');
      setDeleteModal({ isOpen: false, user: null });
      loadUsers();
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
    }
  });

  const roleChangeMutation = useMutation({
    mutationFn: (data: { user_id: number; role: string }) => authApi.changeUserRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleChangeModal({ isOpen: false, user: null, newRole: '' });
      loadUsers();
    },
    onError: (error: any) => {
      console.error('Failed to change user role:', error);
    }
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page,
        search,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      const response = await authApi.getUsers(params);
      const data: UsersListStats = response.data;

      setUsers(data);
      setTotalPages(data.total_pages);
      setTotalUsers(data.count);
    } catch (error) {
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  // Consistent date formatting like Bonni project
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, filters]);

  const handleDeleteUser = (user: UserListItem) => {
    setDeleteModal({ isOpen: true, user });
  };

  const confirmDeleteUser = () => {
    if (deleteModal.user) {
      deleteMutation.mutate(deleteModal.user.id);
    }
  };

  const handleShowCompanyInfo = async (user: UserListItem) => {
    try {
      const response = await authApi.getUserClientInfo(user.id);
      setCompanyInfoModal({
        isOpen: true,
        user,
        companyInfo: response.data,
      });
    } catch (error) {
      setCompanyInfoModal({
        isOpen: true,
        user,
        companyInfo: null,
      });
    }
  };

  const handleShowUserProfile = (user: UserListItem) => {
    setUserProfileModal({ isOpen: true, user });
  };

  const handleChangeRole = (user: UserListItem) => {
    setRoleChangeModal({ isOpen: true, user, newRole: user.role === 'admin' ? 'user' : 'admin' });
  };

  const confirmRoleChange = () => {
    if (roleChangeModal.user && roleChangeModal.newRole) {
      roleChangeMutation.mutate({
        user_id: roleChangeModal.user.id,
        role: roleChangeModal.newRole
      });
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSubscriptionBadge = (type: string, status: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      lifetime: 'bg-green-100 text-green-800'
    };

    const statusColors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <div className="flex gap-1">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || colors.free}`}>
          {type}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.active}`}>
          {status}
        </span>
      </div>
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users, subscriptions, and permissions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>

          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
                      <span className="ml-2 text-gray-500">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                users && users.map((tableUser) => (
                  <tr key={tableUser.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div onClick={() => handleShowUserProfile(tableUser)} className="flex items-center cursor-pointer">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {tableUser.full_name || tableUser.username}
                            </div>
                            {getRoleIcon(tableUser.role)}
                          </div>
                          <div className="text-sm text-gray-500">{tableUser.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{tableUser.total_messages || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{tableUser.total_files || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{dayjs(tableUser.date_joined).format('MMM D, YYYY')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(tableUser.last_login)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleShowUserProfile(tableUser)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {tableUser.id !== user?.id && (
                          <button
                            onClick={() => handleChangeRole(tableUser)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                            title={tableUser.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          >
                            {tableUser.role === 'admin' ? <User className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                          </button>
                        )}
                        {tableUser.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(tableUser)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((page - 1) * 20) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 20, totalUsers)}</span> of{' '}
                  <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pageNum
                            ? 'z-10 bg-primary-50 border-primary-400 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              <button
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteModal.user.full_name || deleteModal.user.username}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, user: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Info Modal */}
      {companyInfoModal.isOpen && companyInfoModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              <button
                onClick={() => setCompanyInfoModal({ isOpen: false, user: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <p className="text-gray-900">{companyInfoModal.user.full_name || companyInfoModal.user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{companyInfoModal.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription</label>
                <p className="text-gray-900">{companyInfoModal.user.subscription_type} ({companyInfoModal.user.subscription_status})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Revenue</label>
                <p className="text-gray-900">${companyInfoModal.user.total_revenue || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Payments</label>
                <p className="text-gray-900">{companyInfoModal.user.total_payments || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {userProfileModal.isOpen && userProfileModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
              <button
                onClick={() => setUserProfileModal({ isOpen: false, user: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{userProfileModal.user.full_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <p className="text-gray-900">{userProfileModal.user.username}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{userProfileModal.user.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="text-gray-900">{userProfileModal.user.role || 'user'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="text-gray-900">Active</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Messages</label>
                  <p className="text-gray-900">{userProfileModal.user.total_messages || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Files</label>
                  <p className="text-gray-900">{userProfileModal.user.total_files || 0}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Joined</label>
                  <p className="text-gray-900">{dayjs(userProfileModal.user.date_joined).format('MMMM D, YYYY')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <p className="text-gray-900">{formatDateTime(userProfileModal.user.last_login)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {roleChangeModal.isOpen && roleChangeModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {roleChangeModal.newRole === 'admin' ? 'Make Admin' : 'Remove Admin'}
              </h3>
              <button
                onClick={() => setRoleChangeModal({ isOpen: false, user: null, newRole: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to {roleChangeModal.newRole === 'admin' ? 'promote' : 'demote'}{' '}
                <span className="font-semibold">{roleChangeModal.user.full_name || roleChangeModal.user.username}</span>{' '}
                {roleChangeModal.newRole === 'admin' ? 'to admin' : 'from admin'}?
              </p>
              {roleChangeModal.newRole === 'admin' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Admin users will have full access to manage other users and system settings.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRoleChangeModal({ isOpen: false, user: null, newRole: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                disabled={roleChangeMutation.isPending}
                className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2 ${
                  roleChangeModal.newRole === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50`}
              >
                {roleChangeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {roleChangeModal.newRole === 'admin' ? 'Make Admin' : 'Remove Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
