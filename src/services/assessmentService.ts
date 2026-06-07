import { supabasedb } from "@/lib/supabaseClient";
import { ServiceResponse } from "@/types/serviceResponse";

// Define the structure of a question
export interface CleanQuestion {
  question_id: number;
  question_text: string;   // corrected: should match DB column
  options: string[];       // use lowercase string[]
}

// Define the structure of a saved response
export interface SaveResponse {
  question_id: number;
  selected_option_index: number; // corrected: match DB column
}

// Fetch assessment questions with options
export const fetchAssessmentStructure = async (): Promise<ServiceResponse<CleanQuestion[]>> => {
  try {
    const { data, error } = await supabasedb
      .from("assessment_questions")
      .select("question_id, question_text, options")
      .order("question_id", { ascending: true });

    if (error) {
      return { success: false, data: null, error: { message: error.message } };
    }
    return { success: true, data: data as CleanQuestion[], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: { message: err.message } };
  }
};

// Fetch already saved options for a user
export const fetchUserSavedProgress = async (
  userId: string
): Promise<ServiceResponse<SaveResponse[]>> => {
  try {
    const { data, error } = await supabasedb
      .from("user_responses") // corrected table name
      .select("question_id, selected_option_index")
      .eq("user_id", userId);

    if (error) {
      return { success: false, data: null, error: { message: error.message } };
    }
    return { success: true, data: data as SaveResponse[], error: null };
  } catch (err: any) {
    return { success: false, data: null, error: { message: err.message } };
  }
};

// Auto-save a single response
export const autoSaveSingleResponse = async (
  userId: string,
  questionId: number,
  optionIndex: number
): Promise<ServiceResponse<null>> => {
  try {
    const { error } = await supabasedb
      .from("user_responses") // corrected table name
      .upsert(
        {
          user_id: userId,
          question_id: questionId,
          selected_option_index: optionIndex, // corrected field name
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id,question_id" } // ensures overwrite on conflict
      );

    if (error) {
      return { success: false, data: null, error: { message: error.message } };
    }
    return { success: true, data: null, error: null };
  } catch (err: any) {
    return { success: false, data: null, error: { message: err.message } };
  }
};


