import { useState } from "react";
import { useAuthStore } from "../Store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });
  const [focusedField, setFocusedField] = useState(null);
  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullname.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.password) return false;
    if (formData.password.length < 6) return false;
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) signup(formData);
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: "" };
    if (password.length < 6) return { strength: 1, text: "Weak" };
    if (password.length < 8) return { strength: 2, text: "Fair" };
    if (password.length < 10) return { strength: 3, text: "Good" };
    return { strength: 4, text: "Strong" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Create Account</h1>
          <p className="text-gray-600 text-sm">Join our community</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2 bg-white text-gray-800 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign up with Google
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-700 font-medium">Full Name</span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-3 flex items-center ${focusedField === 'fullname' ? 'text-blue-600' : 'text-gray-400'}`}>
                <User className="size-5" />
              </div>
              <input
                type="text"
                className="input w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                onFocus={() => setFocusedField('fullname')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-700 font-medium">Email</span>
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-3 flex items-center ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Mail className="size-5" />
              </div>
              <input
                type="email"
                className="input w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text text-gray-700 font-medium">Password</span>
              {passwordStrength.text && (
                <span className={`label-text-alt font-medium ${passwordStrength.strength === 1 ? 'text-red-500' : passwordStrength.strength === 2 ? 'text-orange-500' : passwordStrength.strength === 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {passwordStrength.text}
                </span>
              )}
            </label>
            <div className="relative">
              <div className={`absolute inset-y-0 left-3 flex items-center ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'}`}>
                <Lock className="size-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="input w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-blue-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' : passwordStrength.strength === 2 ? 'bg-orange-500 w-2/4' : passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/4' : 'bg-green-500 w-full'}`}
                  ></div>
                </div>
              </div>
            )}
            <label className="label">
              <span className="label-text-alt text-gray-600 text-xs">Password must be at least 6 characters</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <>
                <Loader2 className="size-5 animate-spin inline mr-2" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center mt-4 text-gray-600 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;