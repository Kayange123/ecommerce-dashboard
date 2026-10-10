import CategoryForm from "@/components/CategoryForm";
import prismadb from "@/lib/prismadb";

const CategoryPage = async (props: {
  params: Promise<{ categoryId: string; storeId: string }>;
}) => {
  const params = await props.params;
  const category = await prismadb.category.findFirst({
    where: {
      id: params.categoryId,
      storeId: params.storeId,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  const billboards = await prismadb.billboard.findMany({
    where: {
      storeId: params.storeId,
    },
  });
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <CategoryForm
          billboards={billboards}
          initialData={category}
          productCount={category?._count.products ?? 0}
        />
      </div>
    </div>
  );
};

export default CategoryPage;
