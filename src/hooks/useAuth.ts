import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/services/auth/RegisterService';
import { loginUser } from '@/services/auth/LoginService';
import { forgotPassword } from '@/services/auth/ForgotPasswordService';
import { updatePassword } from '@/services/auth/UpdatePasswordService';
import { updateProfile } from '@/services/auth/ProfileServices';
import { useAuthContext } from '@/context/AuthContext';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { refreshProfile, logout } = useAuthContext();

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
      const profile = result.data?.profile;

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
    
    await logout();
    router.push('/');
    router.refresh(); 
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

  const handleUpdateProfie = async (emp_id: string | number, designation: string, experience: number, interests: string[], role: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const result = await updateProfile({
      employee_id: emp_id,
      designation,
      experiense_years: experience,
      interests,
      role
    });
    if (!result.success) {
      setError(result.error?.message || 'Failed to update profile');
      setLoading(false);
      return false;
    } else {
      await refreshProfile();
      setSuccessMessage('Profile updated successfully!');
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
    handleUpdateProfie,
    loading,
    error,
    successMessage,
    setError,
    setSuccessMessage
  };
};