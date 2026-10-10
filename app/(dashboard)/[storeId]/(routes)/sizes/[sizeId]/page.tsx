import SizeForm from "@/components/SizeForm";
import prismadb from "@/lib/prismadb";

const SizePage = async (props: {
  params: Promise<{ sizeId: string; storeId: string }>;
}) => {
  const params = await props.params;
  const size = await prismadb.size.findFirst({
    where: {
      id: params.sizeId,
      storeId: params.storeId,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <SizeForm
          initialData={size}
          productCount={size?._count.products ?? 0}
        />
      </div>
    </div>
  );
};

export default SizePage;
