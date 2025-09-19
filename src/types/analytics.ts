export interface AnalyticsEvent {
  id: number;
  event_type: string;
  event_name: string;
  description?: string;
  user?: number;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  referer?: string;
  properties: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface UserActivity {
  id: number;
  user: number;
  date: string;
  login_count: number;
  messages_sent: number;
  files_uploaded: number;
  session_time: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  id: number;
  date: string;
  total_users: number;
  active_users: number;
  new_users: number;
  premium_users: number;
  total_conversations: number;
  total_messages: number;
  total_files: number;
  storage_used: number;
  api_calls: number;
  error_rate: number;
  avg_response_time: number;
  uptime_percentage: number;
  revenue: number;
  created_at: string;
}

export interface Report {
  id: number;
  name: string;
  report_type: string;
  format: string;
  status: string;
  requester: number;
  parameters: Record<string, any>;
  file_path?: string;
  file_size?: number;
  progress: number;
  error_message?: string;
  report_date_start?: string;
  report_date_end?: string;
  created_at: string;
  completed_at?: string;
}

export interface FeatureUsage {
  id: number;
  feature_name: string;
  feature_category: string;
  date: string;
  total_uses: number;
  unique_users: number;
  created_at: string;
}

export interface ErrorLog {
  id: number;
  level: string;
  message: string;
  exception_type?: string;
  stack_trace?: string;
  url?: string;
  http_method?: string;
  user?: number;
  ip_address?: string;
  user_agent?: string;
  context: Record<string, any>;
  resolved: boolean;
  resolved_by?: number;
  resolved_at?: string;
  status: string;
  resolution_notes?: string;
  created_at: string;
}

export interface DashboardStats {
  // User stats
  total_users: number;
  active_users_today: number;
  new_users_today: number;
  premium_users: number;
  
  // Content stats
  total_conversations: number;
  total_messages: number;
  total_files: number;
  total_storage_used: number;
  
  // Performance stats
  avg_response_time: number;
  error_rate: number;
  uptime_percentage: number;
  
  // Revenue stats
  total_revenue: number;
  monthly_revenue: number;
  
  // Chart data
  user_growth_chart: Array<{
    date: string;
    new_users: number;
    total_users: number;
  }>;
  revenue_chart: Array<{
    date: string;
    revenue: number;
  }>;
  activity_chart: {
     date: string;
     questions: number;
     uploads: number;
     active_users: number;
   }[];
  feature_usage_chart: Array<{
    feature_name: string;
    total_uses: number;
    unique_users: number;
  }>;
}

export interface UserActivityStats {
  user_id: number;
  total_logins: number;
  total_messages: number;
  total_files: number;
  total_session_time: number;
  avg_session_time: number;
  last_activity: string;
  activity_by_day: Array<{
    date: string;
    login_count: number;
    messages_sent: number;
    files_uploaded: number;
    session_time: number;
  }>;
}

export interface ErrorStats {
  total_errors: number;
  resolved_errors: number;
  unresolved_errors: number;
  error_rate: number;
  top_errors: Array<{
    exception_type: string;
    count: number;
  }>;
  errors_by_day: Array<{
    date: string;
    error_count: number;
  }>;
}

export interface SystemHealth {
  status: string;
  uptime: number;
  response_time: number;
  error_rate: number;
  total_users: number;
  active_users: number;
  storage_used: number;
  storage_available: number;
  last_updated: string;
}

export interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

// New interfaces for enhanced dashboard
export interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  pending_subscriptions: number;
  subscription_types: {
    free: number;
    basic: number;
    premium: number;
    lifetime: number;
  };
  monthly_revenue: number;
  yearly_revenue: number;
  subscription_trends: ChartData;
  revenue_trends: ChartData;
}

export interface PaymentStats {
  total_payments: number;
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  average_payment: number;
  payment_methods: {
    [key: string]: number;
  };
  payment_trends: ChartData;
  revenue_by_month: ChartData;
  recent_payments: {
    id: number;
    user: string;
    amount: number;
    currency: string;
    payment_type: string;
    status: string;
    created_at: string;
  }[];
}

export interface UserDashboardStats {
  user_info: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    subscription_type: string;
    subscription_status: string;
    subscription_start_date: string;
    subscription_end_date: string;
    days_until_expiry: number;
    created_at: string;
    last_activity: string;
    total_time_spent: number;
  };
  payment_history: {
    id: number;
    amount: number;
    currency: string;
    payment_type: string;
    status: string;
    created_at: string;
  }[];
  file_stats: {
    total_files: number;
    total_size: number;
    files_by_category: {
      [key: string]: number;
    };
  };
  chat_stats: {
    total_messages: number;
    messages_today: number;
    messages_this_week: number;
    messages_this_month: number;
  };
  activity_stats: {
    login_count: number;
    last_login: string;
    sessions_count: number;
    average_session_duration: number;
  };
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  subscription_type: string;
  subscription_status: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  days_until_expiry?: number;
  total_payments?: number;
  total_revenue?: number;
  last_payment_date?: string;
  total_time_spent: number;
  date_joined: string;
  last_login: string | null;
  login_count?: number;
  total_files?: number;
  total_messages?: number;
  // Token usage fields
  total_tokens_used?: number;
  input_tokens_used?: number;
  output_tokens_used?: number;
  last_token_usage_date?: string | null;
  payment_history: any[];
  recent_activity: any[];
  is_active?: boolean;
  // Legacy fields for backward compatibility
  created_at?: string;
  last_activity?: string;
}

export interface UsersListStats {
  results: UserListItem[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}