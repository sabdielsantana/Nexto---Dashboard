import { CategoriesView } from "@/components/categories/categories-view";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { getCategoryOptions, getCategoryTree } from "@/lib/queries/categories";

export const metadata = { title: "Categorías — Nexto" };

export default async function CategoriesPage() {
  const [tree, options] = await Promise.all([
    getCategoryTree(),
    getCategoryOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Organiza tus gastos e ingresos con categorías y subcategorías."
        action={
          tree.length > 0 ? <CategoryFormDialog options={options} /> : undefined
        }
      />
      <CategoriesView tree={tree} options={options} />
    </>
  );
}
