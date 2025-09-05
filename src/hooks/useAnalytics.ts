import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import {
  AnalyticsEvent,
  UserActivity,
  SystemMetrics,
  Report,
  FeatureUsage,
  ErrorLog,
  DashboardStats,
  UserActivityStats,
  ErrorStats,
  SystemHealth,
} from '../types/analytics';

// Analytics Events
export const useAnalyticsEvents = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['analytics-events', params],
    queryFn: () => analyticsApi.getEvents(params),
    select: (data) => data.data,
  });
};

export const useTrackEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: analyticsApi.trackEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

// User Activity
export const useUserActivity = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['user-activity', params],
    queryFn: () => analyticsApi.getUserActivity(params),
    select: (data) => data.data,
  });
};

export const useUserActivityStats = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['user-activity-stats', params],
    queryFn: () => analyticsApi.getUserActivityStats(params),
    select: (data) => data.data,
  });
};

// System Metrics
export const useSystemMetrics = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['system-metrics', params],
    queryFn: () => analyticsApi.getSystemMetrics(params),
    select: (data) => data.data,
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: analyticsApi.getSystemHealth,
    select: (data) => data.data,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useGenerateSystemMetrics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (date: string) => analyticsApi.generateSystemMetrics(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-metrics'] });
    },
  });
};

// Reports
export const useReports = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => analyticsApi.getReports(params),
    select: (data) => data.data,
  });
};

export const useReport = (id: number) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => analyticsApi.getReport(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: analyticsApi.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: (id: number) => analyticsApi.downloadReport(id),
    onSuccess: (data, id) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
};

// Feature Usage
export const useFeatureUsage = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['feature-usage', params],
    queryFn: () => analyticsApi.getFeatureUsage(params),
    select: (data) => data.data,
  });
};

// Error Logs
export const useErrorLogs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['error-logs', params],
    queryFn: () => analyticsApi.getErrorLogs(params),
    select: (data) => data.data,
  });
};

export const useErrorLog = (id: number) => {
  return useQuery({
    queryKey: ['error-log', id],
    queryFn: () => analyticsApi.getErrorLog(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useUpdateErrorLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ErrorLog> }) =>
      analyticsApi.updateErrorLog(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-log', id] });
      queryClient.invalidateQueries({ queryKey: ['error-stats'] });
    },
  });
};

export const useErrorStats = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['error-stats', params],
    queryFn: () => analyticsApi.getErrorStats(params),
    select: (data) => data.data,
  });
};

// Delete Report
export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// Dashboard
export const useDashboardStats = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['dashboard-stats', params],
    queryFn: () => analyticsApi.getDashboardStats(params),
    select: (data) => data.data,
    refetchInterval: 60000, // Refetch every minute
  });
};

// New hooks for enhanced dashboard
export const useSubscriptionStats = (dateRange?: { start_date?: string; end_date?: string }) => {
  return useQuery<any>({
    queryKey: ['subscriptionStats', dateRange],
    queryFn: () => analyticsApi.getSubscriptionStats(dateRange),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const usePaymentStats = (dateRange?: { start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ['paymentStats', dateRange],
    queryFn: () => analyticsApi.getPaymentStats(dateRange),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

export const useUserDashboardStats = (userId?: number) => {
  return useQuery({
    queryKey: ['userDashboardStats', userId],
    queryFn: () => analyticsApi.getUserDashboardStats(userId),
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useUsersListStats = (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  subscription_status?: string;
  subscription_type?: string;
  role?: string;
}) => {
  return useQuery({
    queryKey: ['usersListStats', params],
    queryFn: () => analyticsApi.getUsersListStats(params),
    select: (data) => data.data,
    refetchInterval: 120000, // Refetch every 2 minutes
  });
};