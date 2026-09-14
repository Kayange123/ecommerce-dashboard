import SizeForm from "@/components/SizeForm";
import prismadb from "@/lib/prismadb";
import React from "react";

const SizePage = async ({ params }: { params: { sizeId: string } }) => {
  const sizes = await prismadb.size.findFirst({
    where: {
      id: params.sizeId,
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <SizeForm initialData={sizes} />
      </div>
    </div>
  );
};

export default SizePage;
