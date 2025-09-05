import React from 'react';
import {
  MessageSquare,
  Clock,
  LogIn,
  AlertCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUserDashboardStats } from '../hooks/useAnalytics';

dayjs.extend(relativeTime);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
}

const getColorClasses = (color: string) => {
  const colorMap = {
    primary: 'bg-blue-100 text-blue-600',
    secondary: 'bg-purple-100 text-purple-600',
    success: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-cyan-100 text-cyan-600',
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.primary;
};

const getTextColorClasses = (color: string) => {
  const colorMap = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-cyan-600',
  };
  return colorMap[color as keyof typeof colorMap] || colorMap.primary;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = 'primary', icon }) => (
  <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center space-x-4">
      {icon && (
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getColorClasses(color)} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          {title}
        </h3>
        <p className={`text-3xl font-bold ${getTextColorClasses(color)} mb-1`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
);

interface UserDashboardProps {
  userId?: number;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId }) => {
  const { data: dashboardResponse, isLoading, error } = useUserDashboardStats(userId);

  const formatCurrency = (amount: number | null | undefined, currency: string = 'USD') => {
    if (!amount || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes || isNaN(minutes)) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSubscriptionStatusColor = (status: string | undefined | null) => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'cancelled': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getSubscriptionProgress = (daysLeft: number, totalDays: number = 365) => {
    if (daysLeft <= 0) return 0;
    return Math.min((daysLeft / totalDays) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
        <XCircle className="w-5 h-5 text-red-600" />
        <span className="text-red-800">Failed to load dashboard data. Please try again later.</span>
      </div>
    );
  }

  const dashboardData = dashboardResponse?.data;
  if (!dashboardData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600" />
        <span className="text-blue-800">No user data available.</span>
      </div>
    );
  }

  const { user_info, payment_history, file_stats, chat_stats, activity_stats } = dashboardData;

  return (
    <div className="flex-1 p-5">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {userId ? `Dashboard - ${user_info.full_name || user_info.username}` : 'Profile'}
      </h1>

      {/* User Profile Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {(user_info.full_name || user_info.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user_info.full_name || user_info.username}
              </h2>
              <p className="text-gray-600">
                {user_info.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user_info.role === 'admin' ? 'bg-accent-100 text-accent-800' : 'bg-primary-100 text-primary-800'
            }`}>
              {user_info.role}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
              {user_info.subscription_type}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              getSubscriptionStatusColor(user_info.subscription_status) === 'success' ? 'bg-green-100 text-green-800' :
              getSubscriptionStatusColor(user_info.subscription_status) === 'error' ? 'bg-red-100 text-red-800' :
              getSubscriptionStatusColor(user_info.subscription_status) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              getSubscriptionStatusColor(user_info.subscription_status) === 'info' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              
            </span>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Member since
              </p>
              <p className="text-gray-900 font-medium">
                {dayjs(user_info.created_at).format('MMM DD, YYYY')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Last active
              </p>
              <p className="text-gray-900 font-medium">
                {dayjs(user_info.last_activity).fromNow()}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Progress */}
        {user_info.subscription_status === 'active' && user_info.days_until_expiry !== null && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">
              Subscription expires in {user_info.days_until_expiry} days
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  user_info.days_until_expiry < 30 ? 'bg-accent' : 'bg-success'
                }`}
                style={{ width: `${getSubscriptionProgress(user_info.days_until_expiry)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <StatCard
          title="Chat Messages"
          value={chat_stats?.total_messages || 0}
          subtitle={`${chat_stats?.messages_today || 0} today`}
          color="info"
          icon={<MessageSquare className="w-6 h-6" />}
        />
        <StatCard
          title="Time Spent"
          value={formatDuration(user_info?.total_time_spent)}
          subtitle={`${activity_stats?.sessions_count || 0} sessions`}
          color="success"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          title="Login Count"
          value={activity_stats?.login_count || 0}
          subtitle={`Avg session: ${formatDuration(activity_stats?.average_session_duration)}`}
          color="secondary"
          icon={<LogIn className="w-6 h-6" />}
        />
      </div>
    </div>
  );
};

export default UserDashboard;