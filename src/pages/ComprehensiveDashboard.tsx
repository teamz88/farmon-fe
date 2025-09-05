import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Upload,
  HardDrive,
  MessageSquare,
  UserPlus,
  Eye,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  Line,
  Bar,
  Doughnut,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import dayjs from 'dayjs';
import { useDashboardStats, useSubscriptionStats } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, loading }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2`} style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }} className="w-5 h-5 sm:w-6 sm:h-6">{icon}</div>
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const ComprehensiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dateRange] = useState({
    start_date: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch dashboard data with real-time updates
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats(dateRange);
  const { data: subscriptionStats, isLoading: subscriptionLoading, refetch: refetchSubscriptions } = useSubscriptionStats(dateRange);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchSubscriptions();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchStats, refetchSubscriptions]);

  const handleManualRefresh = () => {
    refetchStats();
    refetchSubscriptions();
    setLastRefresh(new Date());
  };

  // Process chart data from API
  const processChartData = () => {
    if (!dashboardStats) {
      return {
        userGrowthData: { labels: [], datasets: [] },
        activityData: { labels: [], datasets: [] },
        revenueData: { labels: [], datasets: [] },
        featureUsageData: { labels: [], datasets: [] }
      };
    }

    // User Growth Chart Data
    const userGrowthLabels = dashboardStats.user_growth_chart?.map(item => 
      dayjs(item.date).format('MMM DD')
    ) || [];
    
    const userGrowthData = {
       labels: userGrowthLabels,
       datasets: [
         {
           label: 'New Users',
           data: dashboardStats.user_growth_chart?.map(item => item.new_users) || [],
           backgroundColor: 'rgba(34, 197, 94, 0.8)',
           borderColor: 'rgb(34, 197, 94)',
           borderWidth: 1,
         },
       ],
     };

     const totalUsersData = {
       labels: userGrowthLabels,
       datasets: [
         {
           label: 'Total Users',
           data: dashboardStats.user_growth_chart?.map(item => item.total_users) || [],
           borderColor: 'rgb(59, 130, 246)',
           backgroundColor: 'rgba(59, 130, 246, 0.1)',
           tension: 0.4,
           fill: true,
         },
       ],
     };

    // Activity Chart Data (Questions)
     const activityLabels = dashboardStats.activity_chart?.map(item => 
       dayjs(item.date).format('MMM DD')
     ) || [];
     
     const activityData = {
       labels: activityLabels,
       datasets: [
         {
           label: 'Questions Asked',
           data: dashboardStats.activity_chart?.map(item => item.questions) || [],
           borderColor: 'rgb(59, 130, 246)',
           backgroundColor: 'rgba(59, 130, 246, 0.1)',
           tension: 0.4,
           fill: true,
         },
       ],
     };

    // Revenue Chart Data (Site Visits replacement)
    const revenueLabels = dashboardStats.revenue_chart?.map(item => 
      dayjs(item.date).format('MMM DD')
    ) || [];
    
    const revenueData = {
      labels: revenueLabels,
      datasets: [
        {
          label: 'Daily Revenue',
          data: dashboardStats.revenue_chart?.map(item => item.revenue) || [],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    // Feature Usage Chart Data
    const featureUsageData = {
      labels: dashboardStats.feature_usage_chart?.map(item => item.feature_name) || [],
      datasets: [
        {
          label: 'Total Uses',
          data: dashboardStats.feature_usage_chart?.map(item => item.total_uses) || [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };

    return { userGrowthData, totalUsersData, activityData, revenueData, featureUsageData };
  };

  const { userGrowthData, totalUsersData, activityData, revenueData, featureUsageData } = processChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: window.innerWidth < 640 ? 10 : 12,
          },
          padding: window.innerWidth < 640 ? 10 : 20,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 9 : 11,
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 9 : 11,
          },
        },
      },
    },
  } as const;

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: window.innerWidth < 640 ? 10 : 12,
          },
          padding: window.innerWidth < 640 ? 10 : 20,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 9 : 11,
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 9 : 11,
          },
        },
      },
    },
  } as const;

  if (statsError) {
    return (
      <div className="flex-1 p-3 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 text-sm sm:text-base">Failed to load dashboard data. Please try again later.</p>
          <button
            onClick={handleManualRefresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Real-time Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-black text-white rounded-lg hover:bg-black transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
          disabled={statsLoading}
        >
          <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Users"
          value={formatNumber(dashboardStats?.total_users || 0)}
          icon={<Users className="w-6 h-6" />}
          color="#3B82F6"
          loading={statsLoading}
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(subscriptionStats?.data?.active_subscriptions || dashboardStats?.premium_users || 0)}
          icon={<CreditCard className="w-6 h-6" />}
          color="#10B981"
          loading={subscriptionLoading}
        />
        <StatCard
          title="Files Uploaded"
          value={formatNumber(dashboardStats?.total_files || 0)}
          icon={<Upload className="w-6 h-6" />}
          color="#F59E0B"
          loading={statsLoading}
        />
        <StatCard
          title="Storage Used"
          value={formatFileSize(dashboardStats?.total_storage_used || 0)}
          icon={<HardDrive className="w-6 h-6" />}
          color="#EF4444"
          loading={statsLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
        {/* Daily Questions Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Questions (Last 30 Days)</h3>
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="h-64 sm:h-80">
            <Line data={activityData} options={chartOptions} />
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">User Growth (Last 30 Days)</h3>
            <UserPlus className="w-5 h-5 text-green-600" />
          </div>
          <div className="h-64 sm:h-80">
            <Bar data={userGrowthData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Revenue (Last 30 Days)</h3>
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <div className="h-64 sm:h-80">
          <Line data={revenueData} options={chartOptions} />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Messages"
          value={formatNumber(dashboardStats?.total_messages || 0)}
          icon={<MessageSquare className="w-6 h-6" />}
          color="#8B5CF6"
          subtitle="All time"
          loading={statsLoading}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(dashboardStats?.total_revenue || 0).toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="#F59E0B"
          subtitle="All time"
          loading={statsLoading}
        />
        <StatCard
          title="System Performance"
          value={`${(dashboardStats?.uptime_percentage || 99.9).toFixed(1)}%`}
          icon={<Activity className="w-6 h-6" />}
          color="#84CC16"
          subtitle="Uptime"
          loading={statsLoading}
        />
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Auto-refreshing every 30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;