import type { Metadata } from "next";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { ProductManager } from "@/components/admin/product-manager";
import type { Category, ProductWithCategory } from "@/types";

export const metadata: Metadata = {
  title: "Kelola Produk",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [productsResult, categoriesResult] = await Promise.all([
    admin
      .from("products")
      .select("*, category:categories(id, name, slug, icon)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    admin.from("categories").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <ProductManager
      products={(productsResult.data ?? []) as unknown as ProductWithCategory[]}
      categories={(categoriesResult.data ?? []) as Category[]}
    />
  );
}
