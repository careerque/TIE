import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";

export const logoutUser = async (): Promise<ServiceResponse<null>>=> {
    const { error } = await supabasedb.auth.signOut();

    if (error) {
        return { success: false, data: null, error };
    }

    return { success: true, data: null, error: null };
}
