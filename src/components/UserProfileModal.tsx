import React from 'react';
import { X, User, Mail, Calendar, Clock, MessageSquare, FileText, Shield, Building } from 'lucide-react';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { UserListItem } from '../types/analytics';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  if (!isOpen || !user) return null;

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds === 0) return '0 minutes';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'text-purple-600 bg-purple-100';
      case 'user':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative pb-6">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              User Profile
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Detailed information for {user.full_name || user.username}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Basic User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{user.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role || 'user')}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role || 'User'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date Joined</label>
                    <p className="text-gray-900">{dayjs(user.date_joined).format('MMMM DD, YYYY')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Login</label>
                    <p className="text-gray-900">
                      {user.last_login ? dayjs(user.last_login).format('MMMM DD, YYYY HH:mm') : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Login Count</label>
                    <p className="text-gray-900">{user.login_count || 0} times</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Time Spent</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDuration(user.total_time_spent)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Building className="w-5 h-5" />
                Subscription Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Subscription Type</label>
                  <p className="text-gray-900">{user.subscription_type || 'Free'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionStatusColor(user.subscription_status)}`}>
                    {user.subscription_status || 'Free'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Days Until Expiry</label>
                  <p className="text-gray-900">
                    {user.days_until_expiry !== undefined ? `${user.days_until_expiry} days` : 'N/A'}
                  </p>
                </div>
              </div>
              
              {(user.subscription_start_date || user.subscription_end_date) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {user.subscription_start_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subscription Start</label>
                      <p className="text-gray-900">{dayjs(user.subscription_start_date).format('MMMM DD, YYYY')}</p>
                    </div>
                  )}
                  {user.subscription_end_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Subscription End</label>
                      <p className="text-gray-900">{dayjs(user.subscription_end_date).format('MMMM DD, YYYY')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Activity Statistics */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5" />
                Activity Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <label className="text-sm font-medium text-blue-700">Total Messages</label>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{user.total_messages || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <label className="text-sm font-medium text-green-700">Total Files</label>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{user.total_files || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <label className="text-sm font-medium text-purple-700">Time Spent</label>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{formatDuration(user.total_time_spent)}</p>
                </div>
              </div>
            </div>

            {/* Token Usage Statistics */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5" />
                Token Usage Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <label className="text-sm font-medium text-orange-700">Total Tokens</label>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{user.total_tokens_used?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    <label className="text-sm font-medium text-cyan-700">Input Tokens</label>
                  </div>
                  <p className="text-2xl font-bold text-cyan-900">{user.input_tokens_used?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <label className="text-sm font-medium text-indigo-700">Output Tokens</label>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">{user.output_tokens_used?.toLocaleString() || 0}</p>
                </div>
              </div>
              {user.last_token_usage_date && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Last Token Usage</label>
                  <p className="text-gray-900">{dayjs(user.last_token_usage_date).format('MMMM DD, YYYY HH:mm')}</p>
                </div>
              )}
            </div>

            {/* Payment Information */}
            {(user.total_payments || user.total_revenue || user.last_payment_date) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Building className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.total_payments && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Payments</label>
                      <p className="text-gray-900">{user.total_payments}</p>
                    </div>
                  )}
                  {user.total_revenue && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Revenue</label>
                      <p className="text-gray-900">${user.total_revenue}</p>
                    </div>
                  )}
                  {user.last_payment_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Payment</label>
                      <p className="text-gray-900">{dayjs(user.last_payment_date).format('MMMM DD, YYYY')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfileModal;