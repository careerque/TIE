import { supabasedb } from "./supabaseClient";
import questions from "../../public/questions";


export const seedDatabaseQuestions = async () => {
    const formattedData = questions.map((q) => ({
        question_id: q.id,
        question_text: q.question,
        options: q.options
    }));

    const { data, error } = await supabasedb.from("assessment_questions").upsert(formattedData, { onConflict: "question_id" });

    if (error) {
        console.log(" Error seeding questions:", error.message);
        return { success: false, error };
    }

    console.log(` Success! Successfully uploaded ${formattedData.length} questions to the cloud.`);
    return { success: true };
};
