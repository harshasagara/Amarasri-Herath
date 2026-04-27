// ─── Gamification Engine ────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface StudentStats {
  xp: number;
  level: number;
  levelTitle: string;
  levelProgress: number; // 0-100 percent to next level
  achievements: Achievement[];
  totalExams: number;
  bestScore: number;
  avgScore: number;
}

// ─── XP thresholds per level ─────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2400, 3700, 5500, 8000, 12000];

const RANK_TITLES = [
  "Recruit",       // 1
  "Scholar",       // 2
  "Analyst",       // 3
  "Strategist",    // 4
  "Expert",        // 5
  "Champion",      // 6
  "Elite",         // 7
  "Genius",        // 8
  "Grandmaster",   // 9
  "Legend",        // 10
];

export function calcXP(iqScore: number, gkScore: number): number {
  const total = iqScore + gkScore;
  let xp = total; // base XP = total score
  if (iqScore === 100) xp += 50;       // perfect IQ bonus
  if (gkScore === 100) xp += 50;       // perfect GK bonus
  if (total >= 160) xp += 80;          // Elite bonus
  if (total >= 180) xp += 100;         // Legend bonus
  return xp;
}

export function getLevel(xp: number): { level: number; title: string; progress: number } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  level = Math.min(level, 10);
  const title = RANK_TITLES[level - 1];
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = nextThreshold > currentThreshold
    ? Math.min(100, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;
  return { level, title, progress };
}

// ─── Achievement Definitions ──────────────────────────────────────────────────
const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first_exam",   title: "First Step",       description: "Submit your first exam",         icon: "🎯", color: "#3b82f6" },
  { id: "both_papers",  title: "Dual Scholar",      description: "Complete both IQ and GK papers", icon: "📚", color: "#8b5cf6" },
  { id: "iq_perfect",   title: "Mind of Steel",     description: "Score 100/100 on IQ paper",     icon: "🧠", color: "#DC143C" },
  { id: "gk_perfect",   title: "World Expert",      description: "Score 100/100 on GK paper",     icon: "🌍", color: "#10b981" },
  { id: "total_150",    title: "High Achiever",     description: "Score 150+ combined",            icon: "⭐", color: "#f59e0b" },
  { id: "total_180",    title: "Elite Performer",   description: "Score 180+ combined",            icon: "🔥", color: "#ef4444" },
  { id: "total_200",    title: "The Perfectionist", description: "Score 200/200 combined!",        icon: "👑", color: "#fbbf24" },
  { id: "level_5",      title: "Halfway There",     description: "Reach level 5",                  icon: "🏆", color: "#6366f1" },
  { id: "level_10",     title: "Legend",            description: "Reach the max level 10",         icon: "🌟", color: "#dc2626" },
];

export function computeAchievements(params: {
  iqScore: number | null;
  gkScore: number | null;
  totalXP: number;
  level: number;
  existingAchievements: Achievement[];
}): Achievement[] {
  const { iqScore, gkScore, totalXP, level, existingAchievements } = params;
  const existingMap = new Map(existingAchievements.map(a => [a.id, a]));
  const total = (iqScore ?? 0) + (gkScore ?? 0);
  const hasBothPapers = iqScore !== null && gkScore !== null;
  const hasAnyPaper = iqScore !== null || gkScore !== null;
  const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const shouldUnlock: Record<string, boolean> = {
    first_exam:  hasAnyPaper,
    both_papers: hasBothPapers,
    iq_perfect:  (iqScore ?? 0) >= 100,
    gk_perfect:  (gkScore ?? 0) >= 100,
    total_150:   hasBothPapers && total >= 150,
    total_180:   hasBothPapers && total >= 180,
    total_200:   hasBothPapers && total >= 200,
    level_5:     level >= 5,
    level_10:    level >= 10,
  };

  return ACHIEVEMENT_DEFS.map(def => {
    const existing = existingMap.get(def.id);
    const unlocked = shouldUnlock[def.id] ?? false;
    return {
      ...def,
      unlocked,
      unlockedAt: unlocked ? (existing?.unlockedAt ?? now) : undefined,
    };
  });
}

export function loadStudentStats(nic: string): StudentStats {
  const scoresStr = localStorage.getItem(`studentScores_${nic}`) ?? "{}";
  const scores = JSON.parse(scoresStr);
  const iqScore: number | null = scores.iq ?? null;
  const gkScore: number | null = scores.gk ?? null;
  const historyStr = localStorage.getItem(`examHistory_${nic}`) ?? "[]";
  const history: any[] = JSON.parse(historyStr);

  const completedExams = history.filter(e => e.status === "completed");
  const totalExams = completedExams.length;
  const bestScore = completedExams.reduce((best, e) => Math.max(best, e.score ?? 0), 0);
  const avgScore = totalExams > 0
    ? Math.round(completedExams.reduce((sum, e) => sum + (e.score ?? 0), 0) / totalExams)
    : 0;

  const xp = iqScore !== null || gkScore !== null
    ? calcXP(iqScore ?? 0, gkScore ?? 0)
    : 0;
  const { level, title: levelTitle, progress: levelProgress } = getLevel(xp);

  const existingAchStr = localStorage.getItem(`achievements_${nic}`) ?? "[]";
  const existingAchievements: Achievement[] = JSON.parse(existingAchStr);

  const achievements = computeAchievements({ iqScore, gkScore, totalXP: xp, level, existingAchievements });
  localStorage.setItem(`achievements_${nic}`, JSON.stringify(achievements));

  return { xp, level, levelTitle, levelProgress, achievements, totalExams, bestScore, avgScore };
}
