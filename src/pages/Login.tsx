import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Eye, EyeOff, Lock, User, LogIn, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!usernameOrEmail || !password) {
      setError('Please enter both username/email and password');
      setIsLoading(false);
      return;
    }

    const result = await login(usernameOrEmail, password);

    if (result.success) {
      // Redirect based on user role
      const userRole = result.user?.role;
      if (userRole === 'admin') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/chat';
      }
    } else {
      setError(result.error || 'Invalid username/email or password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center overflow-hidden rounded-xl mb-4 shadow-lg">
            <img src='/farmon.png' alt='logo' className='w-full h-16'/>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <LogIn className="w-6 h-6 text-primary-500" />
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-error rounded-full"></div>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail" className="text-sm font-medium text-gray-700">
                  Username or Email
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="pl-11 h-12 border-gray-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-12 h-12 border-gray-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary-400 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </div>
                )}
              </Button>

              {/* Sign up link */}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
