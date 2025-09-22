import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, AlertCircle, Users, Trash2, Eye, Edit, Building, MessageCircle, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { useUsersListStats } from '../hooks/useAnalytics';
import { UserListItem } from '../types/analytics';
import { authApi } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CompanyInfoDetailsModal from '../components/CompanyInfoDetailsModal';
import UserProfileModal from '../components/UserProfileModal';

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    subscription_status: '',
    subscription_type: '',
    role: 'user',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; user: UserListItem | null }>({
    show: false,
    user: null,
  });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [companyInfoModal, setCompanyInfoModal] = useState<{ show: boolean; user: UserListItem | null; companyInfo: any }>({
    show: false,
    user: null,
    companyInfo: null,
  });
  const [userProfileModal, setUserProfileModal] = useState<{ show: boolean; user: UserListItem | null }>({
    show: false,
    user: null,
  });

  const queryClient = useQueryClient();
  const { data: usersData, isLoading: loading, error } = useUsersListStats({
    page: page + 1,
    page_size: pageSize,
    search: search,
    ...filters,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => authApi.deleteUser(userId),
    onSuccess: () => {
      setDeleteConfirm({ show: false, user: null });
      setDeleteError(null);
      window.location.reload();
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      if (error.response?.data?.error) {
        setDeleteError(error.response.data.error);
      } else {
        setDeleteError('Failed to delete user. Please try again.');
      }
    },
  });

  const formatCurrency = (amount: number | null | undefined, currency: string = 'USD') => {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleDeleteUser = async (user: UserListItem) => {
    setDeleteConfirm({ show: true, user });
    setDeleteError(null);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirm.user) return;
    setDeleteError(null);
    deleteUserMutation.mutate(deleteConfirm.user.id);
  };

  const cancelDeleteUser = () => {
    setDeleteConfirm({ show: false, user: null });
    setDeleteError(null);
  };

  const handleShowCompanyInfo = async (user: UserListItem) => {
    try {
      const response = await authApi.getUserClientInfo(user.id);
      setCompanyInfoModal({
        show: true,
        user,
        companyInfo: response.data,
      });
    } catch (error) {
      console.error('Error fetching company info:', error);
      setCompanyInfoModal({
        show: true,
        user,
        companyInfo: null,
      });
    }
  };

  const closeCompanyInfoModal = () => {
    setCompanyInfoModal({ show: false, user: null, companyInfo: null });
  };

  const openUserProfileModal = (user: UserListItem) => {
    setUserProfileModal({ show: true, user });
  };

  const closeUserProfileModal = () => {
    setUserProfileModal({ show: false, user: null });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Users
      </h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Users Overview
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Search Users</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-blue-500 min-w-48"
                placeholder="Search users..."
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <span className="text-error-800">Error loading users data</span>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          User
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Questions Count
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Joined
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Last Login
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(usersData?.results || []).map((user: UserListItem) => (
                        <tr 
                          key={user.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          onClick={() => openUserProfileModal(user)}
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                            <div className="flex items-center">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {user.full_name || user.username}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {user.email || 'No email provided'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                            <div className="flex items-center gap-2 justify-center">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.total_messages || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {dayjs(user.date_joined).format('MMM DD, YYYY')}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                            {user.last_login ? dayjs(user.last_login).format('MMM DD, YYYY') : 'Never'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center justify-center space-x-2">
                              {user.role !== 'admin' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(user);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty State */}
              {(!usersData?.results || usersData.results.length === 0) && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 text-center py-12 mt-4">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500 px-4">Try adjusting your search or filter criteria.</p>
                </div>
              )}

              <div className="bg-white px-3 sm:px-6 py-3 border-t border-gray-200">
                {/* Mobile pagination */}
                <div className="flex flex-col space-y-3 sm:hidden">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {page + 1} of {Math.ceil((usersData?.count || 0) / pageSize)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!usersData || (page + 1) * pageSize >= usersData.count}
                      className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="flex justify-center items-center space-x-2">
                    <label className="text-sm text-gray-700">Rows:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value));
                        setPage(0);
                      }}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Desktop pagination */}
                <div className="hidden sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{page * pageSize + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min((page + 1) * pageSize, usersData?.count || 0)}
                      </span>{' '}
                      of <span className="font-medium">{usersData?.count || 0}</span> results
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-700">Rows per page:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value));
                        setPage(0);
                      }}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!usersData || (page + 1) * pageSize >= usersData.count}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete User
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete{' '}
                  <span className="font-medium">
                    {deleteConfirm.user?.full_name || deleteConfirm.user?.username}
                  </span>
                  ? This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{deleteError}</p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDeleteUser}
                    disabled={deleteUserMutation.isPending}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={deleteUserMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 flex items-center justify-center"
                  >
                    {deleteUserMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Info Details Modal */}
      <CompanyInfoDetailsModal
        isOpen={companyInfoModal.show}
        onClose={closeCompanyInfoModal}
        companyInfo={companyInfoModal.companyInfo}
        userName={companyInfoModal.user?.full_name || companyInfoModal.user?.username || ''}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={userProfileModal.show}
        onClose={closeUserProfileModal}
        user={userProfileModal.user}
      />
    </div>
  );
};

export default UserManagement;