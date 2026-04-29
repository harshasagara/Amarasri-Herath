
export interface StudentResult {
  id: string;
  name: string;
  nic: string;
  province: string;
  district: string;
  subject: string;
  category: string;
  total_marks: number;
  iq_marks: number;
  gk_marks: number;
  created_at: string;
}

export interface SystemConfig {
  ranking_mode: 'general' | 'subject';
  view_rankings: boolean;
  iq_paper_url?: string;
  iq_paper_name?: string;
  gk_paper_url?: string;
  gk_paper_name?: string;
  iq_answer_key?: (number | null)[];
  gk_answer_key?: (number | null)[];
}
