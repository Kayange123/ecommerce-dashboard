"use client";

import { Plus, Tags } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { DataTable } from "../ui/dataTable";
import { EmptyState } from "../ui/empty-state";
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
      <Heading
        icon={Tags}
        title={`Categories (${data?.length})`}
        description="Manage categories for your billboards"
        action={
          <Button
            onClick={() => router.push(`/${params?.storeId}/categories/new`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add category
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
            icon={Tags}
            title="No categories yet"
            description="Add your first category to get started."
            action={{
              label: "Add category",
              href: `/${params?.storeId}/categories/new`,
            }}
          />
        }
      />
      <Heading title="API" description="API calls for categories" />
      <Separator />
      <ApiList entityName="categories" entityIdName="categoryId" />
    </>
  );
};

export default CategoryClient;
