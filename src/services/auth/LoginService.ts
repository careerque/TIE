import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";
import { logoutUser } from "./LogoutService";

export const loginUser = async (email: string, psw: string): Promise<ServiceResponse<any>> => {
    const superbase = supabasedb;
    try {
        const { data: userData, error: userError } = await superbase.auth.signInWithPassword({
            email,
            password: psw
        });

        if (userError) {
            return { success: false, data: null, error: { message: userError.message } };
        }

        const isEmailVerified = await userData.user?.email_confirmed_at;
        if (!isEmailVerified) {
            logoutUser();
            return {
                success: false,
                data: null,
                error: { message: 'Email not verified. Please check your inbox and click the verification link before logging in.' }
            };
        }

        const { data: profileData, error: profileError } = await superbase.from('profiles').select('role, first_name, last_name').eq('id', userData.user.id).single();

        if (profileError) {
            return { success: false, data: null, error: { message: profileError.message } };
        }

        return {
            success: true,
            data: { session: userData.session, profile: profileData },
            error: null
        };
    }
    catch (err: any) {
        return { success: false, data: null, error: { message: err.message || 'Internal connection failure' } };
    }
};