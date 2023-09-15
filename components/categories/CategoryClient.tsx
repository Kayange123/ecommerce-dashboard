"use client";

import { Plus } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { DataTable } from "../ui/dataTable";
import ApiList from "../ApiList";
import { CategoryColumn, Columns } from "./Columns";

interface CategoryProps {
  data: CategoryColumn[];
}

const CategoryClient = ({ data }: CategoryProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <Heading
          title={`Categories (${data?.length})`}
          description="Manage categories for your billboards"
        />
        <Button
          onClick={() => router.push(`/${params?.storeId}/categories/new`)}
        >
          <Plus className="mr-4 w-4 h-4" />
          <span>create</span>
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={Columns} data={data} />
      <Heading title="API" description="API calls for categories" />
      <Separator />
      <ApiList entityName="categories" entityIdName="categoryId" />
    </>
  );
};

export default CategoryClient;
