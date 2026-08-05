import { supabasedb } from "@/lib/supabaseClient";
import { CookieUtils } from "@/lib/cookieUtils";
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



        let profileData = null;
        const { data: fetchProfileData, error: profileError } = await superbase
            .from('profiles')
            .select('first_name, last_name, employee_id, designation, experience_years, interests, role, company_id, team_id, manager_id, assessment_seed')
            .eq('id', userData.user.id)
            .single();

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                // Self-healing fallback: Create missing profile row using metadata
                const firstName = userData.user.user_metadata?.first_name || userData.user.user_metadata?.firstName || '';
                const lastName = userData.user.user_metadata?.last_name || userData.user.user_metadata?.lastName || '';
                
                const { data: insertData, error: insertError } = await superbase
                    .from('profiles')
                    .insert({
                        id: userData.user.id,
                        email: userData.user.email,
                        first_name: firstName,
                        last_name: lastName,
                        role: 'user'
                    })
                    .select('first_name, last_name, employee_id, designation, experience_years, interests, role, company_id, team_id, manager_id, assessment_seed')
                    .single();

                if (insertError) {
                    return { success: false, data: null, error: { message: `Self-healing profile creation failed: ${insertError.message}` } };
                }
                profileData = insertData;
            } else {
                return { success: false, data: null, error: { message: profileError.message } };
            }
        } else {
            profileData = fetchProfileData;
        }

        if (typeof window !== "undefined" && profileData) {
            const expVal = profileData.experience_years !== null && profileData.experience_years !== undefined 
              ? profileData.experience_years 
              : 0;

            CookieUtils.set("tie-user-profile", JSON.stringify({
              first_name: profileData.first_name || "",
              last_name: profileData.last_name || "",
              email: userData.user.email || "",
              employee_id: profileData.employee_id ? String(profileData.employee_id) : "",
              designation: profileData.designation || "",
              experience_years: String(expVal),
              interests: profileData.interests || [],
              role: profileData.role || "user",
              company_id: profileData.company_id || undefined,
              team_id: profileData.team_id || undefined,
              manager_id: profileData.manager_id || undefined,
              assessment_seed: profileData.assessment_seed ? Number(profileData.assessment_seed) : undefined,
            }));
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