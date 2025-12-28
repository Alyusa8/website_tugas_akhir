import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const { user, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    
    // Validasi input
    if (!email) {
      setError("Mohon masukkan email anda!");
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
      await resetPassword(email);
      setSuccess(true);
      setEmail("");
      
      // Auto redirect after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
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
      {/* Forgot Password Card */}
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
            Lupa Sandi?
          </h1>
          <p 
            className="text-sm"
            style={{ color: '#D1D5DB' }}
          >
            Masukkan email anda untuk menerima link reset password
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500 bg-opacity-20 border border-green-400 text-green-200 px-4 py-4 rounded mb-6 text-center">
            <p className="font-medium mb-2">Email Terkirim!</p>
            <p className="text-sm">
              Kami telah mengirimkan link reset password ke email anda. 
              Silakan cek email dan ikuti instruksi untuk mereset password anda.
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
                placeholder="Masukkan email anda"
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
                  Mengirim...
                </>
              ) : (
                'Kirim Link Reset'
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <p 
                className="text-sm"
                style={{ color: '#D1D5DB' }}
              >
                Ingat password anda?{' '}
                <NavLink 
                  to="/login" 
                  className="font-medium hover:underline transition-colors"
                  style={{ color: '#60A5FA' }}
                >
                  Kembali ke Login
                </NavLink>
              </p>
            </div>
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
              <NavLink 
                to="/login" 
                className="font-medium hover:underline transition-colors"
                style={{ color: '#60A5FA' }}
              >
                kembali ke Login sekarang
              </NavLink>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
