import axios from 'axios';
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
  ApiResponse,
  SubscriptionStats,
  PaymentStats,
  UserDashboardStats,
  UsersListStats,
  TokenUsageByUser,
} from '../types/analytics';
import { SendMessageRequest } from '../types/chat';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'https://backendfarmon.omadligrouphq.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for chat operations with longer timeout
const chatApi_instance = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'https://backendfarmon.omadligrouphq.com/api',
  timeout: 60000, // 60 seconds for chat operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add the same interceptors to chat API instance
chatApi_instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

chatApi_instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post<{
      message: string;
      user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        full_name: string;
        phone_number: string | null;
        avatar: string | null;
        role: string;
        subscription_type: string;
        subscription_status: string;
        subscription_start_date: string | null;
        subscription_end_date: string | null;
        is_subscription_active: boolean;
        days_until_expiry: number | null;
        email_notifications: boolean;
        last_activity: string;
        total_time_spent: string;
        date_joined: string;
        last_login: string;
      };
      tokens: {
        refresh: string;
        access: string;
      };
      session_id: number;
    }>('/auth/login/', credentials),

  register: (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    password: string;
    password_confirm: string;
  }) =>
    api.post<{
      message: string;
      user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        full_name: string;
        phone_number: string | null;
        avatar: string | null;
        role: string;
        subscription_type: string;
        subscription_status: string;
        subscription_start_date: string | null;
        subscription_end_date: string | null;
        is_subscription_active: boolean;
        days_until_expiry: number | null;
        email_notifications: boolean;
        last_activity: string;
        total_time_spent: string;
        date_joined: string;
        last_login: string;
      };
      tokens: {
        refresh: string;
        access: string;
      };
    }>('/auth/register/', userData),

  logout: () =>
    api.post('/auth/logout/'),

  refreshToken: () =>
    api.post<{ token: string }>('/auth/refresh/'),

  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password/', { email }),

  validateResetToken: (token: string) => 
    api.get('/auth/reset-password/', { params: { token } }),

  resetPassword: (token: string, newPassword: string, newPasswordConfirm: string) => 
    api.post('/auth/reset-password/', { 
      token, 
      new_password: newPassword, 
      new_password_confirm: newPasswordConfirm 
    }),

  getCurrentUser: () =>
    api.get('/auth/user/'),

  // User management (admin only)
  getUsers: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    subscription_status?: string;
    subscription_type?: string;
    role?: string;
    ordering?: string;
  }) => api.get('/auth/users/', { params }),

  getUser: (id: number) =>
    api.get(`/auth/users/${id}/`),

  updateUser: (id: number, data: any) =>
    api.patch(`/auth/users/${id}/`, data),

  deleteUser: (id: number) =>
    api.delete(`/auth/users/${id}/`),

  // Profile management
  getProfile: () =>
    api.get('/auth/profile/'),

  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    email_notifications?: boolean;
  }) => api.patch('/auth/profile/', data),

  changePassword: (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post('/auth/change-password/', data),

  // Client Info endpoints
  getClientInfo: () => api.get('/auth/client-info/'),
  updateClientInfo: (data: any) => api.patch('/auth/client-info/', data),
  checkClientInfoStatus: () => api.get('/auth/client-info/status/'),
  getUserClientInfo: (userId: number) => api.get(`/auth/users/${userId}/client-info/`),
  
  // Magic link methods
  createMagicLink: (data: {
    first_name: string;
    last_name: string;
    email: string;
    company_name?: string;
    phone_number?: string;
    title?: string;
    position?: string;
  }) => api.post('/auth/magic-link/', data),
  
  validateMagicLink: (token: string) => api.get(`/auth/magic-link/${token}/`),
  
  setMagicLinkPassword: (token: string, data: {
    password: string;
    password_confirm: string;
  }) => api.post(`/auth/magic-link/${token}/set-password/`, data),

  // Generic post method for additional endpoints
  post: (url: string, data?: any) => api.post(url, data),
};

export const analyticsApi = {
  // Analytics Events
  getEvents: (params?: Record<string, any>) =>
    api.get<ApiResponse<AnalyticsEvent>>('/analytics/events/', { params }),

  createEvent: (data: Partial<AnalyticsEvent>) =>
    api.post<AnalyticsEvent>('/analytics/events/', data),

  trackEvent: (data: {
    event_type: string;
    event_name: string;
    description?: string;
    properties?: Record<string, any>;
  }) => api.post('/analytics/track/', data),

  // User Activity
  getUserActivity: (params?: Record<string, any>) =>
    api.get<ApiResponse<UserActivity>>('/analytics/user-activity/', { params }),

  getUserActivityStats: (params?: Record<string, any>) =>
    api.get<UserActivityStats>('/analytics/user-activity/stats/', { params }),

  // System Metrics
  getSystemMetrics: (params?: Record<string, any>) =>
    api.get<ApiResponse<SystemMetrics>>('/analytics/system-metrics/', { params }),

  generateSystemMetrics: (date: string) =>
    api.post('/analytics/system-metrics/generate/', { date }),

  getSystemHealth: () =>
    api.get<SystemHealth>('/analytics/health/'),

  // Reports
  getReports: (params?: Record<string, any>) =>
    api.get<ApiResponse<Report>>('/analytics/reports/', { params }),

  createReport: (data: {
    name: string;
    report_type: string;
    format: string;
    parameters?: Record<string, any>;
    report_date_start?: string;
    report_date_end?: string;
  }) => api.post<Report>('/analytics/reports/', data),

  getReport: (id: number) =>
    api.get<Report>(`/analytics/reports/${id}/`),

  downloadReport: (id: number) =>
    api.get(`/analytics/reports/${id}/download/`, { responseType: 'blob' }),

  deleteReport: (id: string) =>
    api.delete(`/analytics/reports/${id}/`),

  // Feature Usage
  getFeatureUsage: (params?: Record<string, any>) =>
    api.get<ApiResponse<FeatureUsage>>('/analytics/feature-usage/', { params }),

  // Error Logs
  getErrorLogs: (params?: Record<string, any>) =>
    api.get<ApiResponse<ErrorLog>>('/analytics/errors/', { params }),

  getErrorLog: (id: number) =>
    api.get<ErrorLog>(`/analytics/errors/${id}/`),

  updateErrorLog: (id: number, data: Partial<ErrorLog>) =>
    api.patch<ErrorLog>(`/analytics/errors/${id}/`, data),

  logError: (data: {
    level: string;
    message: string;
    exception_type?: string;
    stack_trace?: string;
    context?: Record<string, any>;
  }) => api.post('/analytics/errors/log/', data),

  getErrorStats: (params?: Record<string, any>) =>
    api.get<ErrorStats>('/analytics/errors/stats/', { params }),

  // Dashboard
  getDashboardStats: (params?: Record<string, any>) =>
    api.get<DashboardStats>('/analytics/dashboard/', { params }),

  // Enhanced Dashboard APIs
  getSubscriptionStats: (params?: { start_date?: string; end_date?: string }) =>
    api.get<SubscriptionStats>('/analytics/subscription-stats/', { params }),

  getPaymentStats: (params?: { start_date?: string; end_date?: string }) =>
    api.get<PaymentStats>('/analytics/payment-stats/', { params }),

  getUserDashboardStats: (userId?: number) => {
    const url = userId
      ? `/analytics/user-dashboard-stats/?user_id=${userId}`
      : '/analytics/user-dashboard-stats/';
    return api.get<UserDashboardStats>(url);
  },

  getUsersListStats: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    subscription_status?: string;
    subscription_type?: string;
    role?: string;
  }) => api.get<UsersListStats>('/analytics/users-list-stats/', { params }),

  getTokenUsageByUser: (params?: { start_date?: string; end_date?: string }) =>
    api.get<TokenUsageByUser>('/analytics/token-usage-by-user/', { params }),
};



// Chat API
export const chatApi = {
  // Conversations
  getConversations: () => api.get('/chat/conversations/'),
  createConversation: (data: { title: string }) => api.post('/chat/conversations/', data),
  getConversation: (id: string) => api.get(`/chat/conversations/${id}/`),
  updateConversation: (id: string, data: any) => api.patch(`/chat/conversations/${id}/`, data),
  deleteConversation: (id: string) => api.delete(`/chat/conversations/${id}/delete/`),
  archiveConversation: (id: string) => api.post(`/chat/conversations/${id}/archive/`),
  pinConversation: (id: string) => api.post(`/chat/conversations/${id}/pin/`),
  exportConversation: (id: string) => api.get(`/chat/conversations/${id}/export/`),
  clearAllConversations: () => api.delete('/chat/conversations/clear-all/'),

  // Messages
  getConversationHistory: (conversationId: string) =>
    api.get(`/chat/conversations/${conversationId}/history/`),
  sendMessage: (data: SendMessageRequest) =>
    chatApi_instance.post('/chat/', data),

  // Message feedback
  submitMessageFeedback: (messageId: string, feedback: { feedback_type: string; comment?: string }) =>
    api.post(`/chat/messages/${messageId}/feedback/`, feedback),

  // Feedback APIs
  submitFeedback: (data: { question: string; answer: string; comment: string }) =>
    api.post('/chat/feedback/', data),
  getFeedbacks: (params?: { status?: boolean }) =>
    api.get('/chat/feedbacks/', { params }),

  // RAG Feedback APIs
  submitRAGFeedback: (data: {
    feedback_type: 'thumbs_up' | 'thumbs_down';
    question: string;
    answer: string;
    comment?: string;
    session_id?: string;
    user_id?: string;
  }) => api.post('/chat/feedback/', data),

  getRAGFeedbackAnalytics: (params?: {
    date_from?: string;
    date_to?: string;
    status?: boolean;
  }) => api.get('/chat/feedback/analytics/', { params }),

  // Templates
  getTemplates: () => api.get('/chat/templates/'),
  getTemplate: (id: number) => api.get(`/chat/templates/${id}/`),

  // Folders
  getFolders: () => api.get('/chat/folders/'),
  createFolder: (data: { name: string; description?: string; color?: string }) =>
    api.post('/chat/folders/', data),
  getFolder: (id: string) => api.get(`/chat/folders/${id}/`),
  updateFolder: (id: string, data: { name?: string; description?: string; color?: string }) =>
    api.patch(`/chat/folders/${id}/`, data),
  deleteFolder: (id: string) => api.delete(`/chat/folders/${id}/`),
  getFolderConversations: (folderId: string) =>
    api.get(`/chat/folders/${folderId}/conversations/`),
  moveConversationToFolder: (conversationId: string, data: { folder_id?: string | null }) =>
    api.post(`/chat/conversations/${conversationId}/move/`, data),

  // Stats
  getChatStats: () => api.get('/chat/stats/'),
  getAdminAnalytics: () => api.get('/chat/admin/analytics/'),
};

// Files API
export const filesApi = {
  // File operations
  uploadFile: (formData: FormData, config?: any) => api.post('/files/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes for file uploads
    ...config
  }),
  getFiles: (params?: { page?: number; search?: string; category?: string; folder?: string }) =>
    api.get('/files/', { params }),
  getFile: (id: string) => api.get(`/files/${id}/`),
  updateFile: (id: string, data: any) => api.patch(`/files/${id}/`, data),
  moveFileToFolder: (fileId: string, folderId: string | null) => 
    api.patch(`/files/${fileId}/move/`, { folder_id: folderId }),
  // Admin file operations
  adminDeleteFile: (fileId: string) => api.delete(`/files/admin/${fileId}/delete/`),
  // Bulk operations
  adminBulkDelete: (fileIds: string[]) => api.post('/files/admin/bulk-delete/', { file_ids: fileIds }),

  deleteFile: (id: string) => api.delete(`/files/${id}/`),
  downloadFile: (id: string) => api.get(`/files/${id}/download/`, { responseType: 'blob' }),
  getDownloadUrl: (id: string) => api.get(`/files/${id}/download-url/`),

  // File sharing
  shareFile: (data: { file_id?: string } | string) => {
    const fileId = typeof data === 'string' ? data : data.file_id;
    return api.post(`/files/${fileId}/share/`, typeof data === 'object' ? data : {});
  },
  getFileShares: (fileId?: string) => {
    return fileId ? api.get(`/files/${fileId}/shares/`) : api.get('/files/shares/');
  },

  // File comments
  getFileComments: (fileId: string) => api.get(`/files/${fileId}/comments/`),
  addFileComment: (fileId: string, data: { comment: string }) =>
    api.post(`/files/${fileId}/comments/add/`, data),

  // File versions
  getFileVersions: (fileId: string) => api.get(`/files/${fileId}/versions/`),

  // File statistics
  getFileStats: () => api.get('/files/stats/'),
  bulkAction: (data: { action: string; file_ids: string[] }) =>
    api.post('/files/bulk-action/', data),

  // Admin analytics
  getAdminAnalytics: () => api.get('/files/admin/analytics/'),

  // Folder operations
  getFolders: (params?: { parent?: string }) => api.get('/files/folders/', { params }),
  getFolderTree: () => api.get('/files/folders/tree/'),
  createFolder: (data: { name: string; description?: string; color?: string; parent?: string }) => 
    api.post('/files/folders/', data),
  getFolder: (id: string) => api.get(`/files/folders/${id}/`),
  updateFolder: (id: string, data: { name?: string; description?: string; color?: string }) => 
    api.put(`/files/folders/${id}/`, data),
  deleteFolder: (id: string) => api.delete(`/files/folders/${id}/`),
  moveFolder: (id: string, data: { parent?: string }) =>
    api.post(`/files/folders/${id}/move/`, data),
  restoreFolder: (id: string) => api.post(`/files/folders/${id}/restore/`),
  getFolderContents: (id: string) => api.get(`/files/folders/${id}/contents/`),
  getFolderBreadcrumbs: (id: string) => api.get(`/files/folders/${id}/breadcrumbs/`),
};

export default api;