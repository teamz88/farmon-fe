import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
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
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setIsLoading(false);
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      
      if (response.data.tokens?.access) {
        localStorage.setItem('authToken', response.data.tokens.access);
        localStorage.setItem('refreshToken', response.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password';
      } else if (error.response?.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    password: string;
    password_confirm: string;
  }) => {
    try {
      const response = await authApi.register(userData);
      
      if (response.data.tokens?.access) {
        localStorage.setItem('authToken', response.data.tokens.access);
        localStorage.setItem('refreshToken', response.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response.data?.username) {
          errorMessage = `Username: ${error.response.data.username[0]}`;
        } else if (error.response.data?.email) {
          errorMessage = `Email: ${error.response.data.email[0]}`;
        } else if (error.response.data?.password) {
          errorMessage = `Password: ${error.response.data.password[0]}`;
        } else if (error.response.data?.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authApi.refreshToken();
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
    return false;
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      const userData = response.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error: any) {
      console.error('Failed to refresh user data:', error);
      
      if (error.response?.status === 401) {
        logout();
      }
      
      return { success: false, error: 'Failed to fetch user data' };
    }
  };

  const checkClientInfoStatus = async () => {
    try {
      const response = await authApi.checkClientInfoStatus();
      return response.data;
    } catch (error: any) {
      console.error('Failed to check client info status:', error);
      return { has_client_info: false, is_completed: false };
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    refreshUser,
    checkAuthStatus,
    checkClientInfoStatus,
  };
};