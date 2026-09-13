import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";


export const registerUser = async (email: string, psw: string, firstName: string, lastName: string): Promise<ServiceResponse<any>> => {
  const superbase = supabasedb;
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    const { data: authData, error: authError } = await superbase.auth.signUp({
      email,
      password: psw,
      options: {
        emailRedirectTo: `${origin}/email-confirmation`,
        // Send both formats just to be 100% safe across versions
        data: {
          first_name: firstName,
          last_name: lastName,
          firstName: firstName,
          lastName: lastName
        }
      },
    });

    if (authError) {
      return { success: false, data: null, error: { message: authError.message } };
    }

    // FIX: Supabase returns a user object but 'identities' will be empty if the email already exists
    if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
      return { success: false, data: null, error: { message: "Email already exists" } };
    }

    // Fallback security check
    if (!authData?.user) {
      return { success: false, data: null, error: { message: "An unexpected error occurred during sign up." } };
    }

    return { success: true, data: authData.user, error: null };
  } catch (err: any) {
    return { success: false, data: null, error: { message: err.message || 'Unexpected registration error' } };
  }
};