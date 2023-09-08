import { BillboardColumn } from '@/components/billboard/Columns'
import BillboardClient from '@/components/billboard/client'
import prismadb from '@/lib/prismadb'
import {format} from 'date-fns';


const BillboardsPage = async ({params}: {params: {storeId: string}}) => {
  const billboards = await prismadb.billboard.findMany({
    where: {
      storeId: params.storeId
    },
    orderBy: {
      createdAt: "desc"
    }
  })
  
  const formattedBillboards: BillboardColumn[] = billboards.map((billboard) =>({
    id: billboard.id,
    label: billboard.label,
    createdAt: format(billboard.createdAt, "MMMM do, yyyy")
  }))
  return (
    <div className='flex-col'>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <BillboardClient data={formattedBillboards} />
        </div>
    </div>
  )
}

export default BillboardsPage