import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";

export const forgotPassword = async (email: string): Promise<ServiceResponse<null>> => {
    const supabase = supabasedb;
    try {
        // Query backend verify-email endpoint bypassing RLS constraints securely
        const cleanApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const checkRes = await fetch(`${cleanApiUrl}/api/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
        if (!checkRes.ok) {
            return { success: false, data: null, error: { message: "Failed to verify user status." } };
        }
        const checkData = await checkRes.json();
        if (!checkData.exists) {
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