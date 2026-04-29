"use server";

import { supabase } from "@/lib/supabase";
import { StudentResult, SystemConfig } from "@/types";

// --- STUDENT MANAGEMENT ---

export async function getStudentByNIC(nic: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('nic', nic)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return { success: true, data };
  } catch (error) {
    console.error("Error in getStudentByNIC:", error);
    return { success: false, error: "Failed to fetch student" };
  }
}

export async function upsertStudent(student: any) {
  try {
    const { data, error } = await supabase
      .from('students')
      .upsert({
        nic: student.nic,
        name: student.name,
        province: student.province,
        district: student.district,
        category: student.category,
        updated_at: new Date().toISOString()
      }, { onConflict: 'nic' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error in upsertStudent:", error);
    return { success: false, error: "Failed to save student" };
  }
}

// --- RANKINGS & LEADERBOARD ---

export async function getAdminRankings(params: {
  subject?: string;
  province?: string;
  district?: string;
  category?: string;
  sortBy?: "total_marks" | "iq_marks" | "gk_marks";
}) {
  try {
    let query = supabase
      .from('students_results')
      .select('*');

    if (params.subject) query = query.eq('subject', params.subject);
    if (params.province) query = query.eq('province', params.province);
    if (params.district) query = query.eq('district', params.district);
    if (params.category && params.category !== "ALL") query = query.eq('category', params.category);

    const { data, error } = await query.order(params.sortBy || 'total_marks', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as StudentResult[] };
  } catch (error) {
    console.error("Error in getAdminRankings:", error);
    return { success: false, error: "Failed to fetch rankings" };
  }
}

// --- EXAM HISTORY ---

export async function getStudentHistory(nic: string) {
  try {
    const { data, error } = await supabase
      .from('exam_history')
      .select('*')
      .eq('nic', nic)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error in getStudentHistory:", error);
    return { success: false, error: "Failed to fetch history" };
  }
}

export async function addExamHistory(item: any) {
  try {
    const { error } = await supabase
      .from('exam_history')
      .insert(item);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error in addExamHistory:", error);
    return { success: false, error: "Failed to save history" };
  }
}

// --- SYSTEM CONFIG ---

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .single();

    if (error) return { ranking_mode: 'general', view_rankings: true };
    return data as SystemConfig;
  } catch (error) {
    return { ranking_mode: 'general', view_rankings: true };
  }
}

export async function updateSystemConfig(config: Partial<SystemConfig>) {
  try {
    const { error } = await supabase
      .from('system_config')
      .upsert({ 
        id: 1, 
        ...config 
      }, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error in updateSystemConfig:", error);
    return { success: false, error: "Failed to update config" };
  }
}
