"use client";

import { Package, Plus } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { Columns, ProductColumn } from "./Columns";
import { DataTable } from "../ui/dataTable";
import { EmptyState } from "../ui/empty-state";
import ApiList from "../ApiList";

interface ProductClientProps {
  data: ProductColumn[];
}

const ProductClient = ({ data }: ProductClientProps) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <Heading
        icon={Package}
        title={`Products (${data?.length})`}
        description="Manage products for your store"
        action={
          <Button
            onClick={() => router.push(`/${params?.storeId}/products/new`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add product
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
            icon={Package}
            title="No products yet"
            description="Add your first product to start selling."
            action={{
              label: "Add product",
              href: `/${params?.storeId}/products/new`,
            }}
          />
        }
      />
      <Heading title="API" description="API calls for products" />
      <Separator />
      <ApiList entityName="products" entityIdName="productId" />
    </>
  );
};

export default ProductClient;
