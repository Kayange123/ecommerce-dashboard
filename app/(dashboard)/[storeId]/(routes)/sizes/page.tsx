import { BillboardColumn } from '@/components/billboard/Columns'
import BillboardClient from '@/components/billboard/client'
import { SizeColumn } from '@/components/sizes/Columns';
import SizeClient from '@/components/sizes/client';
import prismadb from '@/lib/prismadb'
import {format} from 'date-fns';


const SizesPage = async ({params}: {params: {storeId: string}}) => {
  const sizes = await prismadb.size.findMany({
    where: {
      storeId: params.storeId
    },
    orderBy: {
      createdAt: "desc"
    }
  })
  
  const formattedBillboards: SizeColumn[] = sizes.map((size) =>({
    id: size.id,
    name: size.name,
    value: size.value,
    createdAt: format(size.createdAt, "MMMM do, yyyy")
  }))
  return (
    <div className='flex-col'>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <SizeClient data={formattedBillboards} />
        </div>
    </div>
  )
}

export default SizesPage