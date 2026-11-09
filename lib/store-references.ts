import prismadb from "@/lib/prismadb";

// Checking that the caller owns the store, and that the resource being
// mutated belongs to it, isn't enough on its own: a create/update body can
// also *point at* other records by id (a product's category and size, a
// category's billboard). Without these checks a store owner could attach
// another store's category/size/billboard to their own records. See
// docs/architecture/authorization.md.

/** Returns an error message if a referenced id isn't in this store. */
export async function checkProductReferences(
  storeId: string,
  categoryId: string,
  sizeId: string
): Promise<string | null> {
  const [category, size] = await Promise.all([
    prismadb.category.findFirst({ where: { id: categoryId, storeId } }),
    prismadb.size.findFirst({ where: { id: sizeId, storeId } }),
  ]);
  if (!category) return "Category not found in this store";
  if (!size) return "Size not found in this store";
  return null;
}

/** Returns an error message if the billboard isn't in this store. */
export async function checkCategoryReferences(
  storeId: string,
  billboardId: string
): Promise<string | null> {
  const billboard = await prismadb.billboard.findFirst({
    where: { id: billboardId, storeId },
  });
  return billboard ? null : "Billboard not found in this store";
}
