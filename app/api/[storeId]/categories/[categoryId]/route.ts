import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { categoryBodySchema, parseBody } from "@/lib/validation";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const parsed = await parseBody(req, categoryBodySchema);
    if (!parsed.success) return new NextResponse(parsed.error, { status: 400 });
    const { name, billboardId } = parsed.data;

    if (!params.categoryId) {
      return new NextResponse("category ID is required", { status: 400 });
    }
    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const category = await prismadb.category.updateMany({
      where: {
        id: params.categoryId,
        storeId: params.storeId,
      },
      data: {
        name,
        billboardId,
      },
    });
    if (category.count === 0)
      return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json(category);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function DELETE(
  _req: Request,
  props: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!params.categoryId) {
      return new NextResponse("Category ID is required", { status: 400 });
    }
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const res = await prismadb.category.deleteMany({
      where: {
        id: params.categoryId,
        storeId: params.storeId,
      },
    });

    if (res.count === 0) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json(res);
  } catch (error) {
    //console.log('BILLBORD_DELETE :', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function GET(
  _req: Request,
  props: { params: Promise<{ categoryId: string }> }
) {
  const params = await props.params;
  try {
    if (!params.categoryId) {
      return new NextResponse("Category ID is required", { status: 400 });
    }

    const category = await prismadb.category.findFirst({
      where: {
        id: params.categoryId,
      },
      include: {
        billboard: true,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    //console.log('[BILLBORD_GET] :', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
