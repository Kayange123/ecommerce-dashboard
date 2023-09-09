import BillboardForm from '@/components/BillboardForm';
import CategoryForm from '@/components/CategoryForm';
import prismadb from '@/lib/prismadb'
import {} from '@prisma/client';
import React from 'react'

const CategoryPage = async ({params}: {params: {categoryId: string, storeId: string}}) => {
  
  const category =  await prismadb.category.findFirst({
    where: {
      id: params.categoryId
    }
  })
  const billboards = await prismadb.billboard.findMany({
    where: {
      storeId: params.storeId
    }
  })
  return (
    <div className='flex-col'>
      <div className="space-y-4 flex-1 p-8">
        <CategoryForm billboards={billboards} initialData={category} />
      </div>
    </div>
  )
}

export default CategoryPage;