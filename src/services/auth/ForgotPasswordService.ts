import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";

export const forgotPassword = async (email: string): Promise<ServiceResponse<null>> => {
    const supabase = supabasedb;
    try {
        // Query your PUBLIC profiles table, not auth.users
        const { data: profile, error: profileError } = await supabase
            .from("profiles") 
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (profileError || !profile) {
            return { success: false, data: null, error: { message: "This email does not exist or account is unverified." } };
        }

        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        // If found, safely proceed to send the reset link
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/update-password`,
        });

        if (resetError) {
            return { success: false, data: null, error: { message: resetError.message } };
        }

        return { success: true, data: null, error: null };
    } catch (err: any) {
        return { success: false, data: null, error: { message: err.message || 'An error occurred' } };
    }
};