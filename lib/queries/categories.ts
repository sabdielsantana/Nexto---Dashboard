import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface CategoryNode {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  parentId: string | null;
  children: CategoryNode[];
}

export interface CategoryOption {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  parentId: string | null;
  /** Nombre calificado, p.ej. "Comida › Restaurantes". */
  path: string;
  depth: number;
}

async function fetchCategories() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, emoji, color, parent_category_id")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Árbol de categorías padre → hijas. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const rows = await fetchCategories();

  const byId = new Map<string, CategoryNode>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        color: row.color,
        parentId: row.parent_category_id,
        children: [],
      },
    ]),
  );

  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    // Si el padre no existe (no debería, hay FK), se trata como raíz.
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}

/** Lista aplanada con la ruta completa, para los selectores. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const tree = await getCategoryTree();
  const options: CategoryOption[] = [];

  function walk(nodes: CategoryNode[], prefix: string, depth: number) {
    for (const node of nodes) {
      const path = prefix ? `${prefix} › ${node.name}` : node.name;
      options.push({
        id: node.id,
        name: node.name,
        emoji: node.emoji,
        color: node.color,
        parentId: node.parentId,
        path,
        depth,
      });
      walk(node.children, path, depth + 1);
    }
  }

  walk(tree, "", 0);
  return options;
}
