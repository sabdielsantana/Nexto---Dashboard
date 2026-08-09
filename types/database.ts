/**
 * Tipos de la base de datos.
 *
 * NOTA: este archivo normalmente se genera con
 *   supabase gen types typescript --local > types/database.ts
 * Se escribió a mano porque el entorno de construcción no tiene una instancia
 * de Supabase levantada. Está alineado 1:1 con
 * `supabase/migrations/0001_initial_schema.sql` y `0002_analytics_rpc.sql`.
 * Al levantar Supabase, regenerarlo con `npm run db:types` y descartar este.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType =
  | "debito"
  | "credito"
  | "efectivo"
  | "inversion"
  | "banca_nacional";

export type TransactionType = "ingreso" | "gasto";

export type BudgetPeriod = "semanal" | "mensual" | "anual";

/** Ambientes del glow de fondo (enum `glow_color` en 0003). */
export type GlowColor =
  | "purpura"
  | "azul"
  | "verde"
  | "naranja"
  | "rosa"
  | "ninguno";

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          institution: string | null;
          balance: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AccountType;
          institution?: string | null;
          balance?: number | string;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: AccountType;
          institution?: string | null;
          balance?: number | string;
          currency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string | null;
          color: string | null;
          parent_category_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji?: string | null;
          color?: string | null;
          parent_category_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          emoji?: string | null;
          color?: string | null;
          parent_category_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          category_id: string | null;
          type: TransactionType;
          amount: number;
          date: string;
          note: string | null;
          is_recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          category_id?: string | null;
          type: TransactionType;
          amount: number | string;
          date?: string;
          note?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          category_id?: string | null;
          type?: TransactionType;
          amount?: number | string;
          date?: string;
          note?: string | null;
          is_recurring?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string | null;
          target_amount: number;
          current_amount: number;
          deadline: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji?: string | null;
          target_amount: number | string;
          current_amount?: number | string;
          deadline: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          emoji?: string | null;
          target_amount?: number | string;
          current_amount?: number | string;
          deadline?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          glow: GlowColor;
          layout_config: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          glow?: GlowColor;
          layout_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          glow?: GlowColor;
          layout_config?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          period: BudgetPeriod;
          limit_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          period: BudgetPeriod;
          limit_amount: number | string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          period?: BudgetPeriod;
          limit_amount?: number | string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      account_balances: {
        Row: {
          account_id: string;
          user_id: string;
          name: string;
          type: AccountType;
          currency: string;
          saldo_base: number;
          saldo_actual: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      daily_net_balance: {
        Args: { p_start: string; p_end: string };
        Returns: {
          day: string;
          ingresos: number;
          gastos: number;
          neto: number;
        }[];
      };
      spending_by_category: {
        Args: { p_start: string; p_end: string };
        Returns: {
          category_id: string | null;
          category_name: string;
          emoji: string | null;
          color: string | null;
          total: number;
        }[];
      };
      income_vs_expense: {
        Args: { p_start: string; p_end: string; p_bucket: string };
        Returns: {
          bucket: string;
          ingresos: number;
          gastos: number;
        }[];
      };
      balance_evolution: {
        Args: { p_start: string; p_end: string; p_bucket: string };
        Returns: {
          bucket: string;
          neto: number;
        }[];
      };
      period_totals: {
        Args: { p_start: string; p_end: string };
        Returns: {
          ingresos: number;
          gastos: number;
        }[];
      };
      budget_usage: {
        Args: { p_period: BudgetPeriod; p_start: string; p_end: string };
        Returns: {
          budget_id: string;
          category_id: string;
          category_name: string;
          emoji: string | null;
          color: string | null;
          limit_amount: number;
          gastado: number;
        }[];
      };
    };
    Enums: {
      account_type: AccountType;
      glow_color: GlowColor;
      transaction_type: TransactionType;
      budget_period: BudgetPeriod;
    };
    CompositeTypes: Record<never, never>;
  };
}

// ── Alias de conveniencia ──────────────────────────────────────────────────
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];
export type FunctionReturns<T extends keyof PublicSchema["Functions"]> =
  PublicSchema["Functions"][T]["Returns"];

export type Account = Tables<"accounts">;
export type Category = Tables<"categories">;
export type Transaction = Tables<"transactions">;
export type Goal = Tables<"goals">;
export type Budget = Tables<"budgets">;
export type UserPreferences = Tables<"user_preferences">;
export type AccountBalance = Views<"account_balances">;
