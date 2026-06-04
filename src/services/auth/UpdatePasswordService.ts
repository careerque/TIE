import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";

export const updatePassword = async (password: string): Promise<ServiceResponse<null>> => {
  try {
    const { error } = await supabasedb.auth.updateUser({
      password
    });

    if (error) {
      return { success: false, data: null, error: { message: error.message } };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    return { success: false, data: null, error: { message: err.message || "Failed to update password" } };
  }
};
