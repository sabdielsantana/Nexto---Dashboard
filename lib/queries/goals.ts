import "server-only";

import { normalizeMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export interface GoalRow {
  id: string;
  name: string;
  emoji: string | null;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  /** Fecha `yyyy-MM-dd` de creación — base para medir el ritmo de ahorro. */
  createdAt: string;
}

export async function getGoals(): Promise<GoalRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("goals")
    .select("id, name, emoji, target_amount, current_amount, deadline, created_at")
    .order("deadline", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    targetAmount: normalizeMoney(row.target_amount),
    currentAmount: normalizeMoney(row.current_amount),
    deadline: row.deadline,
    createdAt: row.created_at.slice(0, 10),
  }));
}
