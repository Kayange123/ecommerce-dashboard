"use client";

import { Plus } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { SizeColumn, Columns } from "./Columns";
import { DataTable } from "../ui/dataTable";
import ApiList from "../ApiList";

interface SizeClientProps {
  data: SizeColumn[];
}

const SizeClient = ({ data }: SizeClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <Heading
          title={`Sizes (${data?.length})`}
          description="Manage sizes for your category"
        />
        <Button onClick={() => router.push(`/${params?.storeId}/sizes/new`)}>
          <Plus className="mr-4 w-4 h-4" />
          <span>create</span>
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={Columns} data={data} />
      <Heading title="API" description="API calls for sizes" />
      <Separator />
      <ApiList entityName="sizes" entityIdName="sizeId" />
    </>
  );
};

export default SizeClient;
