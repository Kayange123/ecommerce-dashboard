import { ShoppingCart } from "lucide-react";

import Heading from "../ui/Heading";
import { Separator } from "../ui/separator";
import { OrderColumn, Columns } from "./Columns";
import { DataTable } from "../ui/dataTable";
import { EmptyState } from "../ui/empty-state";

interface OrderClientProps {
  data: OrderColumn[];
}

const OrderClient = ({ data }: OrderClientProps) => {
  return (
    <>
      <Heading
        icon={ShoppingCart}
        title={`Orders (${data?.length})`}
        description="Manage orders for your store"
      />
      <Separator />
      <DataTable
        searchKey="products"
        columns={Columns}
        data={data}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Orders will appear here once customers complete checkout."
          />
        }
      />
    </>
  );
};

export default OrderClient;
