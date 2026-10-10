"use client";

import { Plus, Ruler } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { SizeColumn, Columns } from "./Columns";
import { DataTable } from "../ui/dataTable";
import { EmptyState } from "../ui/empty-state";
import ApiList from "../ApiList";

interface SizeClientProps {
  data: SizeColumn[];
}

const SizeClient = ({ data }: SizeClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <Heading
        icon={Ruler}
        title={`Sizes (${data?.length})`}
        description="Manage sizes for your products"
        action={
          <Button onClick={() => router.push(`/${params?.storeId}/sizes/new`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add size
          </Button>
        }
      />
      <Separator />
      <DataTable
        searchKey="name"
        columns={Columns}
        data={data}
        emptyState={
          <EmptyState
            icon={Ruler}
            title="No sizes yet"
            description="Add your first size to get started."
            action={{
              label: "Add size",
              href: `/${params?.storeId}/sizes/new`,
            }}
          />
        }
      />
      <Heading title="API" description="API calls for sizes" />
      <Separator />
      <ApiList entityName="sizes" entityIdName="sizeId" />
    </>
  );
};

export default SizeClient;
