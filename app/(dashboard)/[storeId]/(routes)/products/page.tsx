import { BillboardColumn } from '@/components/billboard/Columns'
import BillboardClient from '@/components/billboard/client'
import { ProductColumn } from '@/components/products/Columns';
import ProductClient from '@/components/products/client';
import prismadb from '@/lib/prismadb'
import { priceFormat } from '@/lib/utils';
import {format} from 'date-fns';


const ProductsPage = async ({params}: {params: {storeId: string}}) => {
  const products = await prismadb.product.findMany({
    where: {
      storeId: params.storeId
    },
    include: {
      category: true,
      size: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  })
  
  const formattedProducts: ProductColumn[] = products.map((product) =>({
    id: product.id,
    name: product.name,
    isArchived: product.isArchived,
    isFeatured: product.isFeatured,
    price: product.price,
    category: product.category.name,
    size: product.size.name,
    createdAt: format(product.createdAt, "MMMM do, yyyy")
  }))
  return (
    <div className='flex-col'>
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductClient data={formattedProducts} />
        </div>
    </div>
  )
}

export default ProductsPage