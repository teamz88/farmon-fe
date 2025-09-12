import { NtfyNotifier } from 'ntfybro';

// Notification service configuration
const NTFY_SERVER_URL = import.meta.env.VITE_NTFY_SERVER_URL || 'https://ntfy.hvacvoice.com';
const NTFY_DEFAULT_TOPIC = import.meta.env.VITE_NTFY_DEFAULT_TOPIC || 'farmon';
const NTFY_DEFAULT_EMAIL = import.meta.env.VITE_NTFY_DEFAULT_EMAIL || undefined;

class NotificationService {
  private notifier: any;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.PROD; // Only enable in production
    
    if (this.isEnabled) {
      this.notifier = new NtfyNotifier({
        serverUrl: NTFY_SERVER_URL,
        defaultTopic: NTFY_DEFAULT_TOPIC,
        defaultEmail: NTFY_DEFAULT_EMAIL
      });
    }
  }

  private async sendNotification(
    message: string, 
    title?: string, 
    priority: number = 3, 
    tags?: string,
    options?: any
  ): Promise<boolean> {
    if (!this.isEnabled || !this.notifier) {
      console.log('Notification service disabled or not configured');
      return false;
    }

    try {
      const result = await this.notifier.sendNotification({
        message,
        title,
        priority,
        tags,
        ...options
      });
      
      if (result) {
        console.log(`Notification sent: ${title} - ${message}`);
      } else {
        console.error(`Failed to send notification: ${title} - ${message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async sendErrorNotification(
    errorMessage: string, 
    errorType: string = 'Frontend Error',
    userInfo?: { email?: string; userId?: string }
  ): Promise<boolean> {
    const title = `Frontend Error: ${errorType}`;
    let message = `Frontend error occurred: ${errorMessage}`;
    
    if (userInfo?.email) {
      message += `\nUser: ${userInfo.email}`;
    }
    
    if (userInfo?.userId) {
      message += `\nUser ID: ${userInfo.userId}`;
    }
    
    // Add browser info
    message += `\nBrowser: ${navigator.userAgent}`;
    message += `\nURL: ${window.location.href}`;
    
    return this.sendNotification(
      message,
      title,
      5, // High priority
      'error,frontend,critical'
    );
  }

  async sendApiErrorNotification(
    endpoint: string,
    statusCode: number,
    errorMessage: string,
    userInfo?: { email?: string; userId?: string }
  ): Promise<boolean> {
    const title = `API Error: ${statusCode}`;
    let message = `API request error:\nEndpoint: ${endpoint}\nStatus: ${statusCode}\nError: ${errorMessage}`;
    
    if (userInfo?.email) {
      message += `\nUser: ${userInfo.email}`;
    }
    
    return this.sendNotification(
      message,
      title,
      4, // High priority
      'api,error,frontend'
    );
  }

  async sendAuthErrorNotification(
    errorType: string,
    errorMessage: string,
    userEmail?: string
  ): Promise<boolean> {
    const title = `Auth Error: ${errorType}`;
    let message = `Authentication error: ${errorMessage}`;
    
    if (userEmail) {
      message += `\nUser: ${userEmail}`;
    }
    
    return this.sendNotification(
      message,
      title,
      4,
      'auth,error,security'
    );
  }

  async sendNetworkErrorNotification(
    errorMessage: string,
    userInfo?: { email?: string; userId?: string }
  ): Promise<boolean> {
    const title = 'Network Error';
    let message = `Network error: ${errorMessage}`;
    
    if (userInfo?.email) {
      message += `\nUser: ${userInfo.email}`;
    }
    
    message += `\nURL: ${window.location.href}`;
    
    return this.sendNotification(
      message,
      title,
      4,
      'network,error,connectivity'
    );
  }

  async sendJavaScriptErrorNotification(
    error: Error,
    userInfo?: { email?: string; userId?: string }
  ): Promise<boolean> {
    const title = 'JavaScript Error';
    let message = `JavaScript error:\nError: ${error.message}\nStack: ${error.stack?.substring(0, 500) || 'No stack trace'}`;
    
    if (userInfo?.email) {
      message += `\nUser: ${userInfo.email}`;
    }
    
    message += `\nURL: ${window.location.href}`;
    
    return this.sendNotification(
      message,
      title,
      5, // Highest priority
      'javascript,error,critical'
    );
  }

  async sendWarningNotification(
    warningMessage: string,
    title: string = 'Frontend Warning'
  ): Promise<boolean> {
    return this.sendNotification(
      warningMessage,
      title,
      4,
      'warning,frontend'
    );
  }

  async sendInfoNotification(
    infoMessage: string,
    title: string = 'Frontend Info'
  ): Promise<boolean> {
    return this.sendNotification(
      infoMessage,
      title,
      2,
      'info,frontend'
    );
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
export default notificationService;