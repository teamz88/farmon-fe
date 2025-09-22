import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Eye, EyeOff, User, Mail, Phone, Lock, Save, CheckCircle, AlertCircle, Building, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authApi, chatApi } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import ClientInfoModal from '../components/ClientInfoModal';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  avatar: string | null;
  role: string;
  title: string | null;
  position: string | null;
  company_name: string | null;
  subscription_type: string;
  subscription_status: string;
  email_notifications: boolean;
  date_joined: string;
  last_login: string;
}

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClientInfoModal, setShowClientInfoModal] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [isLoadingClientInfo, setIsLoadingClientInfo] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    email_notifications: true,
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  
  // Danger zone state
  const [isClearingChats, setIsClearingChats] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadClientInfo = async () => {
    try {
      setIsLoadingClientInfo(true);
      const response = await authApi.getClientInfo();
      setClientInfo(response.data);
    } catch (error) {
      console.error('Failed to load client info:', error);
      setClientInfo(null);
    } finally {
      setIsLoadingClientInfo(false);
    }
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const result = await refreshUser();
      
      if (result.success && result.user) {
        const data = result.user;
        setProfileData(data);
        setProfileForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          email_notifications: data.email_notifications,
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load profile data' });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await authApi.updateProfile(profileForm);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      // Reload profile data
      await loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (!validatePassword(passwordForm.new_password)) {
      setMessage({ type: 'error', text: 'Password does not meet security requirements' });
      return;
    }
    
    try {
      setIsChangingPassword(true);
      await authApi.changePassword(passwordForm);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.old_password?.[0] ||
                          error.response?.data?.new_password?.[0] ||
                          'Failed to change password';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Trigger validation for new password
    if (name === 'new_password') {
      validatePassword(value);
    }
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleClearAllChats = async () => {
    setIsClearingChats(true);
    try {
      await chatApi.clearAllConversations();
      setMessage({ type: 'success', text: 'All chat histories have been cleared successfully' });
      setShowClearConfirmation(false);
      // Refresh the page after successful deletion
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to clear chat histories:', error);
      setMessage({ type: 'error', text: 'Failed to clear chat histories. Please try again.' });
    } finally {
      setIsClearingChats(false);
    }
  };

  const handleCancelClearChats = () => {
    setShowClearConfirmation(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>
        
        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={profileForm.first_name}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={profileForm.last_name}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your email"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Company Information */}
                {(profileData?.company_name || profileData?.title) && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Information
                    </h3>
                    
                    {profileData?.company_name && (
                      <div className="space-y-2 mb-3">
                        <Label>Company Name</Label>
                        <Input
                          value={profileData.company_name}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {profileData?.title && (
                        <div className="space-y-2">
                          <Label>Title/Position</Label>
                          <Input
                            value={profileData.title}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email_notifications"
                    name="email_notifications"
                    checked={profileForm.email_notifications}
                    onChange={handleProfileInputChange}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <Label htmlFor="email_notifications" className="text-sm">
                    Receive email notifications
                  </Label>
                </div> */}
                
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="old_password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="old_password"
                      name="old_password"
                      type={showPasswords.old ? 'text' : 'password'}
                      value={passwordForm.old_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter current password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('old')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.new_password && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600 mb-1">Password requirements:</p>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidation.minLength ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidation.hasUppercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidation.hasLowercase ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidation.hasNumber ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidation.hasSpecialChar ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          <span>One special character</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password_confirm">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="new_password_confirm"
                      name="new_password_confirm"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.new_password_confirm}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.new_password_confirm && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordForm.new_password === passwordForm.new_password_confirm ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-red-600">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={
                    isChangingPassword || 
                    passwordForm.new_password !== passwordForm.new_password_confirm ||
                    (passwordForm.new_password.length > 0 && !Object.values(passwordValidation).every(Boolean))
                  }
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Changing Password...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Change Password
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Account Information */}
        {profileData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Read-only account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Username:</span>
                  <p className="text-gray-900">{profileData.username}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Role:</span>
                  <p className="text-gray-900 capitalize">{profileData.role}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Member Since:</span>
                  <p className="text-gray-900">{new Date(profileData.date_joined).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <p className="text-gray-900 capitalize">{profileData.subscription_status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Danger Zone */}
        <Card className="border-red-200 mt-5">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-500">
              These actions are irreversible. Please proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-red-50 border border-red-200 rounded-lg gap-4">
                <div className="flex-1">
                   <h4 className="font-medium text-red-800 mb-2">Clear All Chat Histories & Folders</h4>
                   <p className="text-sm text-red-600">
                     This will permanently delete all your chat conversations, messages, and project folders. This action cannot be undone.
                   </p>
                 </div>
                <div className="flex-shrink-0">
                  <Button
                       onClick={() => setShowClearConfirmation(true)}
                       variant="destructive"
                       size="sm"
                       className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                     >
                       <Trash2 className="h-4 w-4 mr-2" />
                       Clear All Data
                     </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Clear Confirmation Modal */}
        <Dialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                 <Trash2 className="h-5 w-5" />
                 Clear All Chat Histories & Folders
               </DialogTitle>
               <DialogDescription className="text-gray-600">
                 This action cannot be undone. All your conversations, chat data, and project folders will be permanently deleted.
               </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleCancelClearChats}
                className="bg-gray-50 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAllChats}
                disabled={isClearingChats}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isClearingChats ? 'Clearing...' : 'Yes, Clear All'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Client Info Modal */}
      <ClientInfoModal
         isOpen={showClientInfoModal}
         onClose={() => setShowClientInfoModal(false)}
         existingData={clientInfo}
         onComplete={() => {
           setShowClientInfoModal(false);
           setMessage({ type: 'success', text: 'Company information updated successfully' });
           loadClientInfo(); // Reload client info after update
         }}
       />
    </div>
  );
};

export default Profile;