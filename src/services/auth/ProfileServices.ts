import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";

export const getProfile = async (): Promise<ServiceResponse<any>> => {
    try {
        const { data: { user }, error: authError } = await supabasedb.auth.getUser();
        if (authError || !user) {
            return { success: false, data: null, error: { message: "Unauthorized: No active user session found." } };
        }

        const { data, error: dbError } = await supabasedb
            .from("profiles")
            .select("first_name, last_name, employee_id, designation, experiense_years, interests, role")
            .eq("id", user.id)
            .single();

        if (dbError) {
            return { success: false, data: null, error: { message: dbError.message } };
        }

        return { success: true, data: { ...data, email: user.email }, error: null };
    }
    catch (err: any) {
        return { success: false, data: null, error: { message: err.message || 'Unexpected retrieval error' } };
    }
};

export const updateProfile = async (updates: {
    first_name?: string;
    last_name?: string;
    employee_id?: string | number;
    designation?: string;
    experiense_years?: number;
    interests?: string[];
    role?: string;
}): Promise<ServiceResponse<any>> => {
    try {
        const { data: { user }, error: authError } = await supabasedb.auth.getUser();
        if (authError || !user) {
            return { success: false, data: null, error: { message: "Unauthorized: No active user session found." } };
        }

        const { data, error: dbError } = await supabasedb
            .from("profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

        if (dbError) {
            return { success: false, data: null, error: { message: dbError.message } };
        }

        return { success: true, data: data, error: null };
    }
    catch (err: any) {
        return { success: false, data: null, error: { message: err.message || 'Unexpected update error' } };
    }
};