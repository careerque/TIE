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
            .select("first_name, last_name, employee_id, designation, experience_years, interests, role, company_id, team_id, manager_id")
            .eq("id", user.id)
            .single();

        if (dbError) {
            return { success: false, data: null, error: { message: dbError.message } };
        }

        const expVal = data.experience_years !== null && data.experience_years !== undefined 
            ? data.experience_years 
            : 0;

        return { success: true, data: { ...data, experience_years: expVal, email: user.email }, error: null };
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
    experience_years?: number;
    interests?: string[];
    role?: string;
    company_id?: string;
    team_id?: string;
    manager_id?: string;
}): Promise<ServiceResponse<any>> => {
    try {
        const { data: { user }, error: authError } = await supabasedb.auth.getUser();
        if (authError || !user) {
            return { success: false, data: null, error: { message: "Unauthorized: No active user session found." } };
        }

        const { data, error: dbError } = await supabasedb
            .from("profiles")
            .upsert({ id: user.id, email: user.email || "", ...updates })
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