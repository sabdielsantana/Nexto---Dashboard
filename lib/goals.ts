import { differenceInCalendarDays } from "date-fns";

import { fromDateKey } from "@/lib/dates";
import {
  type Money,
  ZERO,
  percentOf,
  roundedDivide,
  subtract,
} from "@/lib/money";

export type GoalStatus =
  | "completada"
  | "en_ritmo"
  | "atrasada"
  | "sin_ritmo"
  | "vencida";

export interface GoalProjection {
  status: GoalStatus;
  /** Porcentaje ahorrado (0-100+). */
  percent: number;
  /** Lo que falta para llegar a la meta. */
  remaining: Money;
  /** Días de calendario hasta la fecha límite (negativo si ya pasó). */
  daysLeft: number;
  /** Ritmo observado de ahorro, en centavos por día. `null` si no se puede medir. */
  pacePerDay: Money | null;
  /** Ahorro diario necesario para llegar a tiempo. `null` si ya no aplica. */
  requiredPerDay: Money | null;
  /**
   * Días que faltarían al ritmo actual. `null` si el ritmo es nulo o la meta
   * ya está completa.
   */
  daysAtCurrentPace: number | null;
}

interface GoalInput {
  /** Monto objetivo, en centavos. */
  target: Money;
  /** Monto ya ahorrado, en centavos. */
  current: Money;
  /** Fecha límite `yyyy-MM-dd`. */
  deadline: string;
  /** Fecha de creación de la meta `yyyy-MM-dd` — base del ritmo observado. */
  createdAt: string;
}

/**
 * Proyecta si la meta llegará a tiempo comparando el ritmo de ahorro observado
 * (lo acumulado desde que se creó la meta) con el ritmo necesario para cubrir
 * lo que falta antes de la fecha límite.
 */
export function projectGoal(input: GoalInput, today = new Date()): GoalProjection {
  const remaining = subtract(input.target, input.current);
  const percent = percentOf(input.current, input.target);
  const daysLeft = differenceInCalendarDays(fromDateKey(input.deadline), today);

  if (remaining <= ZERO) {
    return {
      status: "completada",
      percent,
      remaining: ZERO,
      daysLeft,
      pacePerDay: null,
      requiredPerDay: null,
      daysAtCurrentPace: null,
    };
  }

  // Ritmo observado: lo ahorrado repartido entre los días transcurridos.
  const elapsed = Math.max(
    differenceInCalendarDays(today, fromDateKey(input.createdAt)),
    0,
  );
  const pacePerDay =
    elapsed > 0 && input.current > ZERO
      ? roundedDivide(input.current, BigInt(elapsed))
      : null;

  if (daysLeft < 0) {
    return {
      status: "vencida",
      percent,
      remaining,
      daysLeft,
      pacePerDay,
      requiredPerDay: null,
      daysAtCurrentPace: null,
    };
  }

  // Con la fecha límite hoy mismo, todo lo que falte hay que cubrirlo ya.
  const requiredPerDay =
    daysLeft > 0 ? roundedDivide(remaining, BigInt(daysLeft)) : remaining;

  if (pacePerDay === null || pacePerDay <= ZERO) {
    return {
      status: "sin_ritmo",
      percent,
      remaining,
      daysLeft,
      pacePerDay,
      requiredPerDay,
      daysAtCurrentPace: null,
    };
  }

  const daysAtCurrentPace = Number(roundedDivide(remaining, pacePerDay));

  return {
    status: daysAtCurrentPace <= daysLeft ? "en_ritmo" : "atrasada",
    percent,
    remaining,
    daysLeft,
    pacePerDay,
    requiredPerDay,
    daysAtCurrentPace,
  };
}

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  completada: "Completada",
  en_ritmo: "Vas a tiempo",
  atrasada: "Vas atrasado",
  sin_ritmo: "Sin ritmo aún",
  vencida: "Fecha vencida",
};
