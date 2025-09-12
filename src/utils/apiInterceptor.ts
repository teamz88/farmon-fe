import axios, { AxiosError, AxiosResponse } from 'axios';
import { notificationService } from '../services/notificationService';

// Get user info helper function
function getUserInfo() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        email: user.email,
        userId: user.id?.toString()
      };
    }
  } catch (e) {
    console.error('Failed to get user info:', e);
  }
  return undefined;
}

// Response interceptor for handling API errors
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful responses as-is
    return response;
  },
  async (error: AxiosError) => {
    // Handle API errors
    const userInfo = getUserInfo();
    
    if (error.response) {
      // Server responded with error status
      const { status, data, config } = error.response;
      const endpoint = config?.url || 'Unknown endpoint';
      const method = config?.method?.toUpperCase() || 'Unknown method';
      
      let errorMessage = 'Unknown error';
      
      // Extract error message from response
      if (typeof data === 'object' && data !== null) {
        if ('message' in data) {
          errorMessage = (data as any).message;
        } else if ('error' in data) {
          errorMessage = (data as any).error;
        } else if ('detail' in data) {
          errorMessage = (data as any).detail;
        } else {
          errorMessage = JSON.stringify(data).substring(0, 200);
        }
      } else if (typeof data === 'string') {
        errorMessage = data.substring(0, 200);
      }
      
      // Send API error notification for critical errors
      if (status >= 500) {
        // Server errors (5xx)
        await notificationService.sendApiErrorNotification(
          `${method} ${endpoint}`,
          status,
          errorMessage,
          userInfo
        );
      } else if (status === 401) {
        // Authentication errors
        await notificationService.sendAuthErrorNotification(
          'Unauthorized Access',
          `${method} ${endpoint}: ${errorMessage}`,
          userInfo?.email
        );
      } else if (status === 403) {
        // Authorization errors
        await notificationService.sendAuthErrorNotification(
          'Forbidden Access',
          `${method} ${endpoint}: ${errorMessage}`,
          userInfo?.email
        );
      } else if (status >= 400 && status < 500) {
        // Client errors (4xx) - only log critical ones
        if (status === 404 && endpoint.includes('/api/')) {
          // API endpoint not found - this might be a backend issue
          await notificationService.sendApiErrorNotification(
            `${method} ${endpoint}`,
            status,
            `API endpoint not found: ${errorMessage}`,
            userInfo
          );
        }
      }
    } else if (error.request) {
      // Network error - no response received
      const networkError = error.message || 'Network connection failed';
      
      await notificationService.sendNetworkErrorNotification(
        `Network error: ${networkError}`,
        userInfo
      );
    } else {
      // Something else happened
      const generalError = error.message || 'Unknown request error';
      
      await notificationService.sendErrorNotification(
        `Request setup error: ${generalError}`,
        'API Request Error',
        userInfo
      );
    }
    
    // Always reject the promise to maintain normal error handling flow
    return Promise.reject(error);
  }
);

// Request interceptor for logging (optional)
axios.interceptors.request.use(
  (config) => {
    // You can add request logging here if needed
    return config;
  },
  async (error) => {
    // Handle request errors
    const userInfo = getUserInfo();
    
    await notificationService.sendErrorNotification(
      `Request configuration error: ${error.message || 'Unknown error'}`,
      'API Request Configuration Error',
      userInfo
    );
    
    return Promise.reject(error);
  }
);

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', async (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  const userInfo = getUserInfo();
  
  let errorMessage = 'Unknown promise rejection';
  if (event.reason instanceof Error) {
    errorMessage = event.reason.message;
  } else if (typeof event.reason === 'string') {
    errorMessage = event.reason;
  } else {
    errorMessage = JSON.stringify(event.reason).substring(0, 200);
  }
  
  await notificationService.sendErrorNotification(
    `Unhandled promise rejection: ${errorMessage}`,
    'Promise Rejection Error',
    userInfo
  );
});

// Global error handler for JavaScript errors
window.addEventListener('error', async (event) => {
  console.error('Global JavaScript error:', event.error);
  
  const userInfo = getUserInfo();
  
  if (event.error instanceof Error) {
    await notificationService.sendJavaScriptErrorNotification(event.error, userInfo);
  } else {
    await notificationService.sendErrorNotification(
      `JavaScript error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
      'JavaScript Runtime Error',
      userInfo
    );
  }
});

export default axios;