import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { signIn, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Reset form ketika komponen dimount
  useEffect(() => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Validasi input
    if (!email || !password) {
      setError("Mohon isi email dan password!");
      setLoading(false);
      return;
    }
    
    // Validasi email format sederhana
    if (!email.includes('@')) {
      setError("Format email tidak valid!");
      setLoading(false);
      return;
    }
    
    try {
      await signIn(email, password);
      // Success - user akan di-redirect oleh useEffect
      navigate('/'); // Redirect ke home page
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // User akan di-redirect oleh Supabase ke auth/callback
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Google login gagal. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/images/backgroundlogin.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#667eea', // fallback color
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Login Card */}
      <div 
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{
          backgroundColor: 'rgba(75, 85, 99, 0.9)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: '#F7FAFC' }}
          >
            Login akun
          </h1>
          <p 
            className="text-sm"
            style={{ color: '#D1D5DB' }}
          >
            Selamat datang, silahkan masukkan akun anda
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Email Field */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#F7FAFC' }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan Email anda"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(55, 65, 81, 0.8)',
                color: '#F7FAFC',
                borderColor: '#4B5563'
              }}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium"
                style={{ color: '#F7FAFC' }}
              >
                Password
              </label>
              <NavLink
                to="/forgot-password"
                className="text-xs hover:underline transition-colors"
                style={{ color: '#60A5FA' }}
              >
                Lupa sandi?
              </NavLink>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password anda"
                disabled={loading}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(55, 65, 81, 0.8)',
                  color: '#F7FAFC',
                  borderColor: '#4B5563'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <img 
                    src="/images/eyeopenline.png" 
                    alt="Hide Password" 
                    className="w-5 h-5"
                  />
                ) : (
                  <img 
                    src="/images/eyecloseline.png" 
                    alt="Show Password" 
                    className="w-5 h-5"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              backgroundColor: '#3B82F6'
            }}
            onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.backgroundColor = '#2563EB')}
            onMouseLeave={(e) => !loading && ((e.target as HTMLElement).style.backgroundColor = '#3B82F6')}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Masuk...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div 
            className="flex-1 h-px"
            style={{ backgroundColor: 'rgba(209, 213, 219, 0.3)' }}
          ></div>
          <span 
            className="px-4 text-sm"
            style={{ color: '#D1D5DB' }}
          >
            atau
          </span>
          <div 
            className="flex-1 h-px"
            style={{ backgroundColor: 'rgba(209, 213, 219, 0.3)' }}
          ></div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'rgba(55, 65, 81, 0.8)',
            borderColor: '#4B5563',
            border: '1px solid'
          }}
          onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.backgroundColor = 'rgba(75, 85, 99, 0.9)')}
          onMouseLeave={(e) => !loading && ((e.target as HTMLElement).style.backgroundColor = 'rgba(55, 65, 81, 0.8)')}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Masuk...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p 
            className="text-sm"
            style={{ color: '#D1D5DB' }}
          >
            Belum memiliki akun? silahkan{' '}
            <NavLink 
              to="/register" 
              className="font-medium hover:underline transition-colors"
              style={{ color: '#60A5FA' }}
            >
              Daftar
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}