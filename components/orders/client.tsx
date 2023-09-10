import Heading from "../ui/Heading";
import { Separator } from "../ui/separator";
import { OrderColumn, Columns } from "./Columns";
import { DataTable } from "../ui/dataTable";

interface OrderClientProps {
  data: OrderColumn[]
}

const OrderClient = ({data}: OrderClientProps) => {
    
  return (
    <>
       <Heading title={`Orders (${data?.length})`} description="Manage orders for your store"  />    
       <Separator />
       <DataTable searchKey="products" columns={Columns} data={data} />
    </>
  )
}

export default OrderClient