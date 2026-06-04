import { useState } from 'react';
import { registerUser } from '@/services/auth/RegisterService';
import { loginUser } from '../services/auth/LoginService';
import { logoutUser } from '@/services/auth/LogoutService';
import { forgotPassword } from '@/services/auth/ForgotPasswordService';
import { updatePassword } from '@/services/auth/UpdatePasswordService';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (email: string, psw: string, first_name: string, last_name: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await registerUser(email, psw, first_name, last_name);

    if (!result.success) {
      setError(result.error?.message || 'Registration failed');
      setLoading(false);
      return false;
    } else {
      // Save name to localStorage for fallback, will be synced when logged in
      localStorage.setItem('userFirstName', first_name.trim());
      localStorage.setItem('userLastName', last_name.trim());
      setSuccessMessage('Account created! Please check your inbox for the verification email.');
      setLoading(false);
      return true;
    }
  };

  const handleLogin = async (email: string, psw: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await loginUser(email, psw);

    if (!result.success) {
      setError(result.error?.message || 'Something went wrong');
      setLoading(false);
      return false;
    } else {
      // Save authentication state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email.trim());
      
      const profile = result.data?.profile;
      if (profile) {
        localStorage.setItem('userFirstName', profile.first_name || '');
        localStorage.setItem('userLastName', profile.last_name || '');
        if (profile.role) {
          localStorage.setItem('userRole', profile.role);
        }
      }

      // Dispatch auth-change event so components like Navbar update instantly
      window.dispatchEvent(new Event('auth-change'));

      // Redirect based on role
      if (profile?.role === 'admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
      return true;
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    
    await logoutUser();

    // Clear authentication state from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userRole');

    // Dispatch auth-change event
    window.dispatchEvent(new Event('auth-change'));

    // Redirect to home page
    router.push('/');
    setLoading(false);
  };

  const handleForgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await forgotPassword(email);

    if (!result.success) {
      setError(result.error?.message || 'Failed to send reset link');
      setLoading(false);
      return false;
    } else {
      setSuccessMessage('Password reset link sent! Please check your inbox.');
      setLoading(false);
      return true;
    }
  };

  const handleUpdatePassword = async (password: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const result = await updatePassword(password);

    if (!result.success) {
      setError(result.error?.message || 'Failed to update password');
      setLoading(false);
      return false;
    } else {
      setSuccessMessage('Password updated successfully! Redirecting you to sign in...');
      setLoading(false);
      return true;
    }
  };

  return {
    handleRegister,
    handleLogin,
    handleLogout,
    handleForgotPassword,
    handleUpdatePassword,
    loading,
    error,
    successMessage,
    setError,
    setSuccessMessage
  };
};