"use client";

import { Image as ImageIcon, Plus } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { BillboardColumn, Columns } from "./Columns";
import { DataTable } from "../ui/dataTable";
import { EmptyState } from "../ui/empty-state";
import ApiList from "../ApiList";

interface BillboardClientProps {
  data: BillboardColumn[];
}

const BillboardClient = ({ data }: BillboardClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <Heading
        icon={ImageIcon}
        title={`Billboards (${data?.length})`}
        description="Manage billboards for your store"
        action={
          <Button
            onClick={() => router.push(`/${params?.storeId}/billboards/new`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add billboard
          </Button>
        }
      />
      <Separator />
      <DataTable
        searchKey="label"
        columns={Columns}
        data={data}
        emptyState={
          <EmptyState
            icon={ImageIcon}
            title="No billboards yet"
            description="Add your first billboard to get started."
            action={{
              label: "Add billboard",
              href: `/${params?.storeId}/billboards/new`,
            }}
          />
        }
      />
      <Heading title="API" description="API calls for billboards" />
      <Separator />
      <ApiList entityName="billboards" entityIdName="billboardId" />
    </>
  );
};

export default BillboardClient;
