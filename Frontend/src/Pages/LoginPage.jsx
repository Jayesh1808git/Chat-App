import { useState } from 'react';
import { useAuthStore } from '../Store/useAuthStore';
import AuthImagePattern from '../Components/AuthImagePattern';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [focusedField, setFocusedField] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, isLoggingIn } = useAuthStore();

  const validateForm = () => {
    if (!formData.email.trim()) return toast.error('Email is required');
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error('Invalid email format');
    if (!formData.password) return toast.error('Password is required');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) login(formData);
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/google`;
    }, 500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-base-100 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Left Side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl backdrop-blur-sm border border-gray-100 dark:border-gray-700 relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center 
                group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300 transform group-hover:scale-110"
              >
                <MessageSquare className="size-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mt-4 bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-base-content/70 text-lg">Sign in to your account</p>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoggingIn}
              className="btn btn-outline w-full rounded-xl flex items-center justify-center gap-3 hover:bg-base-200 transition-all hover:shadow-md border-gray-200 dark:border-gray-700 px-6 py-6 text-lg"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-base-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-4 text-base-content/60 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base flex items-center gap-2">
                  Email
                  {formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                    <CheckCircle className="size-4 text-green-500" />
                  )}
                </span>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                    focusedField === 'email' ? 'text-primary' : 'text-primary/60'
                  }`}
                >
                  <Mail className="size-5" />
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-12 py-6 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base">
                  Password
                    

                </span>
              </label>
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                    focusedField === 'password' ? 'text-primary' : 'text-primary/60'
                  }`}
                >
                  <Lock className="size-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input input-bordered w-full pl-12 py-6 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/40 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-6 rounded-xl text-lg font-medium transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 transform hover:-translate-y-1 bg-gradient-to-r from-primary to-secondary border-0"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-base-content/70">
              Don’t have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up instead
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-6">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs text-base-content/50">Secure sign-in process</span>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full max-w-md flex justify-between mt-6 text-sm text-base-content/60">
          <div className="flex items-center gap-1">
            <CheckCircle className="size-4 text-primary/70" />
            <span>Easy Setup</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="size-4 text-primary/70" />
            <span>Free Forever</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="size-4 text-primary/70" />
            <span>Premium Support</span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <AuthImagePattern
        title="Welcome Back!"
        subtitle="Sign in to continue your conversations and catch up with your messages."
      />
    </div>
  );
};

export default LoginPage;