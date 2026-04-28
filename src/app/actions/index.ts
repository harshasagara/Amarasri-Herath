
"use server";

import { supabase } from "@/lib/supabase";
import { StudentResult, SystemConfig } from "@/types";

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
    if (params.category) query = query.eq('category', params.category);

    const { data, error } = await query.order(params.sortBy || 'total_marks', { ascending: false });

    if (error) throw error;

    return { success: true, data: data as StudentResult[] };
  } catch (error) {
    console.error("Error in getAdminRankings:", error);
    return { success: false, error: "Failed to fetch rankings" };
  }
}

export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .single();

    if (error) {
      // Return defaults if table doesn't exist or other error
      return { ranking_mode: 'general', view_rankings: true };
    }

    return data as SystemConfig;
  } catch (error) {
    return { ranking_mode: 'general', view_rankings: true };
  }
}
