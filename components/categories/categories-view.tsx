"use client";

import { CornerDownRight, Pencil, Plus, Tags } from "lucide-react";

import { deleteCategory } from "@/app/(app)/categorias/actions";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import type { CategoryNode, CategoryOption } from "@/lib/queries/categories";

interface CategoriesViewProps {
  tree: CategoryNode[];
  options: CategoryOption[];
}

export function CategoriesView({ tree, options }: CategoriesViewProps) {
  if (tree.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="Aún no hay categorías"
        description="Crea categorías principales y anídales subcategorías para clasificar tus gastos con detalle."
        action={<CategoryFormDialog options={options} />}
      />
    );
  }

  const optionsById = new Map(options.map((option) => [option.id, option]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tree.map((node) => (
        <Card key={node.id}>
          <CardContent className="space-y-1 p-3">
            <CategoryRow
              node={node}
              options={options}
              option={optionsById.get(node.id)}
              isRoot
            />
            {node.children.length > 0 ? (
              <div className="space-y-1 border-l border-border pl-4">
                {node.children.map((child) => (
                  <CategoryRow
                    key={child.id}
                    node={child}
                    options={options}
                    option={optionsById.get(child.id)}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface CategoryRowProps {
  node: CategoryNode;
  options: CategoryOption[];
  option: CategoryOption | undefined;
  isRoot?: boolean;
}

function CategoryRow({ node, options, option, isRoot = false }: CategoryRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50">
      {!isRoot ? (
        <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : null}

      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base"
        style={{ backgroundColor: `${node.color ?? "#64748b"}22` }}
      >
        {node.emoji ?? "•"}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{node.name}</p>
        {isRoot && node.children.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {node.children.length}{" "}
            {node.children.length === 1 ? "subcategoría" : "subcategorías"}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center">
        {isRoot ? (
          <CategoryFormDialog
            options={options}
            defaultParentId={node.id}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Añadir subcategoría a ${node.name}`}
              >
                <Plus />
              </Button>
            }
          />
        ) : null}

        {option ? (
          <CategoryFormDialog
            category={option}
            options={options}
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar ${node.name}`}
              >
                <Pencil />
              </Button>
            }
          />
        ) : null}

        <ConfirmDelete
          title={`Eliminar "${node.name}"`}
          description="Las subcategorías pasarán a ser categorías principales y las transacciones asociadas quedarán sin categoría. Las transacciones no se eliminan."
          successMessage="Categoría eliminada"
          onConfirm={() => deleteCategory(node.id)}
        />
      </div>
    </div>
  );
}
