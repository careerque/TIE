import { supabasedb } from '@/lib/supabaseClient';

const supabase = supabasedb;

export const projectService = {
  /**
   * ── PROFILE CRUD ──
   */
  async getProfile(userId: string) {
    const { data, error } = await supabasedb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // In development, handle missing table gracefully to avoid hard crashes
      console.warn('Error fetching profile from database:', error.message);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * ── ASSESSMENT CRUD ──
   */
  async getAssessments(userId: string) {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching assessments from database:', error.message);
      return [];
    }
    return data;
  },

  async saveAssessment(userId: string, assessmentData: any) {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        ...assessmentData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * ── REFLECTION CRUD ──
   */
  async getReflections(userId: string) {
    const { data, error } = await supabase
      .from('assessment_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reflections from database:', error.message);
      return [];
    }
    return data;
  },

  async saveReflection(userId: string, reflectionData: any) {
    const { data, error } = await supabase
      .from('assessment_feedback')
      .insert({
        user_id: userId,
        work_style_accuracy: reflectionData.work_style_accuracy,
        important_dimension: reflectionData.important_dimension,
        takeaways_reflection: reflectionData.takeaways_reflection,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * ── GENERIC PROJECT CRUD ──
   */
  async getProjects(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching projects from database:', error.message);
      return [];
    }
    return data;
  },

  async createProject(userId: string, projectData: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        ...projectData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
