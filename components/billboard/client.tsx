"use client";

import { Plus } from "lucide-react";
import Heading from "../ui/Heading";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { useParams, useRouter } from "next/navigation";
import { BillboardColumn, Columns } from "./Columns";
import { DataTable } from "../ui/dataTable";
import ApiList from "../ApiList";

interface BillboardClientProps {
  data: BillboardColumn[]
}

const BillboardClient = ({data}: BillboardClientProps) => {
    const router  = useRouter();
    const params = useParams();
    
  return (
    <>
    <div className="flex flex-row items-center justify-between">
       <Heading title={`Billboards (${data?.length})`} description="Manage billboards for your store"  />
       <Button onClick={()=> router.push(`/${params?.storeId}/billboards/new`)}>
        <Plus className="mr-4 w-4 h-4" />
        <span>Add New</span>
       </Button>
    </div>
       <Separator />
       <DataTable searchKey="label" columns={Columns} data={data} />
       <Heading title="API" description="API calls for billboards" />
       <ApiList />
    </>
  )
}

export default BillboardClient