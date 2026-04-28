
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
}
