import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { checkCategoryReferences } from "@/lib/store-references";
import { categoryBodySchema, parseBody } from "@/lib/validation";

export async function POST(
  req: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const parsed = await parseBody(req, categoryBodySchema);
    if (!parsed.success) return new NextResponse(parsed.error, { status: 400 });
    const { name, billboardId } = parsed.data;

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 });

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const referenceError = await checkCategoryReferences(
      params.storeId,
      billboardId
    );
    if (referenceError)
      return new NextResponse(referenceError, { status: 400 });

    const category = await prismadb.category.create({
      data: {
        name,
        billboardId,
        storeId: params.storeId,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    //console.log('CATEGORY_POST', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  _req: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  const params = await props.params;
  try {
    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 });
    const categories = await prismadb.category.findMany({
      where: {
        storeId: params.storeId,
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    // console.log('BILLIBORDS_POST', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
