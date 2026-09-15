import BillboardForm from "@/components/BillboardForm";
import prismadb from "@/lib/prismadb";
import {} from "@prisma/client";
import React from "react";

const BillboardPage = async (props: {
  params: Promise<{ billboardId: string }>;
}) => {
  const params = await props.params;
  const billboard = await prismadb.billboard.findFirst({
    where: {
      id: params.billboardId,
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;
