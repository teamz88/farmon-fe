import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Mail, User, Building, Phone, Sparkles, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
import { authApi } from '../services/api';

interface MagicLinkFormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  title: string;
  position: string;
}

const MagicLinkRegister: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MagicLinkFormData>({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phoneNumber: '',
    title: '',
    position: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.createMagicLink({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        company_name: formData.companyName,
        phone_number: formData.phoneNumber,
        title: formData.title,
        position: formData.position
      });

      // Store authentication data
        if (response.data.access && response.data.refresh) {
          localStorage.setItem('authToken', response.data.access);
          localStorage.setItem('refreshToken', response.data.refresh);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard immediately
        navigate('/dashboard');
      } else {
        // Fallback: show success message with magic link
        setSuccess(true);
        setMagicLink(response.data.magic_link);
        setUserData(response.data.user);
      }
    } catch (err: any) {
      if (err.response?.data?.email) {
        setError(err.response.data.email[0]);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else {
        setError('Failed to create magic link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {userData ? 'Account Created Successfully!' : 'Magic Link Sent!'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {userData 
                ? 'Your account has been created and you are now signed in. You will be redirected to the dashboard shortly.'
                : 'We\'ve sent a magic link to your email address. Click the link to complete your registration.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <Label className="text-sm font-medium text-primary-700">Welcome, {userData.first_name}!</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-primary-600">Username: {userData.username}</p>
                    <p className="text-sm text-primary-600">Email: {userData.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Magic Link:</Label>
                  <div className="mt-1 p-2 bg-white border rounded text-xs font-mono break-all">
                    {magicLink}
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center mt-4">
                  Please check your email and click the magic link to set your password and access the platform.
                </p>
              </div>
             )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
            <img src="/farmon_fav.png" alt="logo" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Get Your Free Farmon Link
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your details to receive a magic link for instant platform access
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                Company Name
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                  placeholder="Your Company Ltd."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title/Position
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                  placeholder="CEO, Manager, Developer, etc."
                />
              </div>
            </div>
            
            {/* <div className="space-y-2">
              <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                Position
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="pl-10 border-gray-300 focus:border-primary-400 focus:ring-primary-400"
                  placeholder="Senior, Junior, Lead, etc."
                />
              </div>
            </div> */}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-400 to-secondary-400 hover:from-primary-500 hover:to-secondary-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Magic Link...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Get Your Free Farmon Link</span>
                </div>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              By clicking "Get Your Free Farmon Link", you agree to receive a magic link via email to access the platform.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default MagicLinkRegister;