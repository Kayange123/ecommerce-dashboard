import BillboardForm from "@/components/BillboardForm";
import prismadb from "@/lib/prismadb";

const BillboardPage = async (props: {
  params: Promise<{ billboardId: string; storeId: string }>;
}) => {
  const params = await props.params;
  const billboard = await prismadb.billboard.findFirst({
    where: {
      id: params.billboardId,
      storeId: params.storeId,
    },
    include: {
      _count: {
        select: { categories: true },
      },
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <BillboardForm
          initialData={billboard}
          categoryCount={billboard?._count.categories ?? 0}
        />
      </div>
    </div>
  );
};

export default BillboardPage;
