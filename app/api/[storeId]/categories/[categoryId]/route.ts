import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, {params}: {params: {storeId: string, categoryId: string}}){
    try {
        const { userId} = auth();
        const body = await req.json();
        const {name , billboardId} =  body;
        if(!userId){
            return new NextResponse("Unauthorized", {status: 401})
        }
        if(!name){
            return new NextResponse("Name is required", {status: 400}); 
        }
        if(!billboardId){
            return new NextResponse("Billboard ID is required", {status: 400}); 
        }
        if(!params.categoryId){
            return new NextResponse("category ID is required", {status: 400});
        }
        if(!params.storeId){
            return new NextResponse("Store ID is required", {status: 400});
        } 

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: params.storeId,
                userId
            }
        })
        if(!storeByUserId) return new NextResponse("Unauthorized", {status: 403});
        

        const category = await prismadb.category.updateMany({
            where: {
                id: params.categoryId,
                
            },
            data : {
                name,
                billboardId
            }
        });
        return NextResponse.json(category);
    } catch (error) {
        console.log('BILLBOARD_PATCH :', error);
        return new NextResponse("Internal Server Error", {status: 500});
    }

}
export async function DELETE(_req: Request, {params}: {params: {storeId: string, categoryId: string}}){
    try {
        const { userId} = auth();
        
        if(!userId){
            return new NextResponse("Unauthorized", {status: 401});
        }
        
        if(!params.storeId){
            return new NextResponse("Store ID is required", {status: 400});
        }
        if(!params.categoryId){
            return new NextResponse("Category ID is required", {status: 400});
        }
        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: params.storeId,
                userId
            }
        })
        if(!storeByUserId) return new NextResponse("Unauthorized", {status: 403});
        
        const res = await prismadb.category.deleteMany({
            where: {
                id: params.categoryId,
            }
            
        });
        
        return NextResponse.json(res);
    } catch (error) {
        //console.log('BILLBORD_DELETE :', error);
        return new NextResponse("Internal Server Error", {status: 500});
    }


}
export async function GET(_req: Request, {params}: {params: { categoryId: string}}){
    try {
       
        if(!params.categoryId){
            return new NextResponse("Category ID is required", {status: 400});
        }
       
        const category = await prismadb.category.findFirst({
            where: {
                id: params.categoryId,
            },
            include : {
                billboard: true,
            }
        });
        return NextResponse.json(category);
    } catch (error) {
        //console.log('[BILLBORD_GET] :', error);
        return new NextResponse("Internal Server Error", {status: 500});
    }

}