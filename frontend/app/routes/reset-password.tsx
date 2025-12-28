import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  
  const navigate = useNavigate();

  // Check if user has reset token
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Link reset tidak valid atau telah kadaluarsa. Silakan coba lagi.");
      }
    };
    getSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    
    // Validasi input
    if (!password || !confirmPassword) {
      setError("Mohon isi semua field!");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password harus minimal 6 karakter!");
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Password tidak cocok!");
      setLoading(false);
      return;
    }
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Terjadi kesalahan saat mereset password. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (error && error.includes("tidak valid")) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/images/backgroundlogin.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#667eea',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div 
          className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
          style={{
            backgroundColor: 'rgba(75, 85, 99, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="text-center">
            <h1 
              className="text-3xl font-bold mb-4"
              style={{ color: '#F7FAFC' }}
            >
              Link Tidak Valid
            </h1>
            <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-4 rounded mb-6">
              {error}
            </div>
            <a
              href="/forgot-password"
              className="inline-block py-3 px-6 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: '#3B82F6' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563EB')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#3B82F6')}
            >
              Minta Link Reset Lagi
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/images/backgroundlogin.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#667eea',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Reset Password Card */}
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
            Reset Password
          </h1>
          <p 
            className="text-sm"
            style={{ color: '#D1D5DB' }}
          >
            Masukkan password baru anda
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500 bg-opacity-20 border border-green-400 text-green-200 px-4 py-4 rounded mb-6 text-center">
            <p className="font-medium mb-2">Password Berhasil Direset!</p>
            <p className="text-sm">
              Password anda telah berhasil diubah. 
              Silakan login dengan password baru anda.
            </p>
            <p className="text-xs mt-3">
              Anda akan diarahkan ke halaman login dalam beberapa detik...
            </p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* New Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#F7FAFC' }}
              >
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password baru"
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

            {/* Confirm Password Field */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-2"
                style={{ color: '#F7FAFC' }}
              >
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? (
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
              <p 
                className="text-xs mt-2"
                style={{ color: '#9CA3AF' }}
              >
                Password harus minimal 6 karakter
              </p>
            </div>

            {/* Submit Button */}
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
                  Mereset...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* After Success - Login Link */}
        {success && (
          <div className="text-center">
            <p 
              className="text-sm"
              style={{ color: '#D1D5DB' }}
            >
              Atau{' '}
              <a
                href="/login"
                className="font-medium hover:underline transition-colors"
                style={{ color: '#60A5FA' }}
              >
                login sekarang
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
