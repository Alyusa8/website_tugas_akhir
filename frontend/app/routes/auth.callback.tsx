import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL (contains auth tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' && accessToken) {
          // Email verification successful
          // Set the session manually
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('Error setting session:', error);
            // Try to communicate with opener window before redirect
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'auth_error', 
                message: 'verification_failed' 
              }, window.location.origin);
              window.close();
            } else {
              navigate('/login?error=verification_failed');
            }
            return;
          }

          // Check if this window was opened from another window (tab)
          if (window.opener && !window.opener.closed) {
            // Notify the opener window of successful verification
            window.opener.postMessage({ 
              type: 'auth_success', 
              user: data.user,
              message: 'verification_completed'
            }, window.location.origin);
            
            // Close this tab/window
            window.close();
          } else {
            // If no opener, navigate normally (fallback)
            navigate('/?verified=true');
          }
          
        } else if (type === 'recovery' && accessToken) {
          // Password reset callback
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
              type: 'password_reset', 
              access_token: accessToken,
              refresh_token: refreshToken 
            }, window.location.origin);
            window.close();
          } else {
            navigate(`/reset-password?access_token=${accessToken}&refresh_token=${refreshToken}`);
          }
        } else {
          // Invalid or missing tokens
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ 
              type: 'auth_error', 
              message: 'invalid_link' 
            }, window.location.origin);
            window.close();
          } else {
            navigate('/login?error=invalid_link');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ 
            type: 'auth_error', 
            message: 'callback_failed' 
          }, window.location.origin);
          window.close();
        } else {
          navigate('/login?error=callback_failed');
        }
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Memproses verifikasi...
        </h2>
        <p className="text-gray-600">
          Mohon tunggu, kami sedang memverifikasi akun Anda.
        </p>
      </div>
    </div>
  );
}