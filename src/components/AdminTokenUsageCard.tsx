import { useState } from 'react';
import { Activity, Users, TrendingUp, MessageSquare, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useTokenUsageByUser } from '../hooks/useAnalytics';
import dayjs from 'dayjs';

interface AdminTokenUsageCardProps {
  className?: string;
}

const AdminTokenUsageCard: React.FC<AdminTokenUsageCardProps> = ({ className = '' }) => {
  const [dateRange, setDateRange] = useState({
    start_date: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: tokenUsageData, isLoading, error } = useTokenUsageByUser(dateRange);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleDateRangeChange = (field: 'start_date' | 'end_date', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p>Error loading token statistics</p>
        </div>
      </div>
    );
  }

  const topUsers = tokenUsageData?.data?.slice(0, 5) || [];
  const totalUsers = tokenUsageData?.total_users || 0;
  const totalTokens = tokenUsageData?.data?.reduce((sum, user) => sum + user.total_tokens, 0) || 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Token Usage Statistics
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Calendar className="w-4 h-4 text-gray-600" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Chat Used Users</p>
              <p className="text-2xl font-bold text-blue-900">
                {isLoading ? '...' : formatNumber(totalUsers)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Tokens</p>
              <p className="text-2xl font-bold text-green-900">
                {isLoading ? '...' : formatNumber(totalTokens)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Avg Tokens/Message</p>
              <p className="text-2xl font-bold text-purple-900">
                {isLoading ? '...' : formatNumber(
                  tokenUsageData?.data?.reduce((sum, user) => sum + user.avg_tokens_per_message, 0) / (tokenUsageData?.data?.length || 1) || 0
                )}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      {isExpanded && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Top Token Users</h4>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Output Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Messages Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg/Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topUsers.map((user, index) => (
                    <tr key={user.user_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatNumber(user.total_tokens)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(user.input_tokens)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(user.output_tokens)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(user.message_count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(Math.round(user.avg_tokens_per_message))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No data found for the selected date range
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTokenUsageCard;