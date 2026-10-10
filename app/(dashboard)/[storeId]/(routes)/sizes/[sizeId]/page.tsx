import SizeForm from "@/components/SizeForm";
import prismadb from "@/lib/prismadb";

const SizePage = async (props: { params: Promise<{ sizeId: string }> }) => {
  const params = await props.params;
  const size = await prismadb.size.findFirst({
    where: {
      id: params.sizeId,
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
