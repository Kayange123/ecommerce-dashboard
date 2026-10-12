import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseBody, productBodySchema } from "@/lib/validation";

export async function POST(
  req: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const parsed = await parseBody(req, productBodySchema);
    if (!parsed.success) return new NextResponse(parsed.error, { status: 400 });
    const { name, price, images, isFeatured, isArchived, categoryId, sizeId } =
      parsed.data;

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

    const product = await prismadb.product.create({
      data: {
        name,
        price,
        isFeatured,
        isArchived,
        categoryId,
        sizeId,
        storeId: params.storeId,
        images: {
          createMany: {
            data: images,
          },
        },
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// GET -> {origin}/{storeId}/products
export async function GET(
  req: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured");

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 });
    const products = await prismadb.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        sizeId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
      },
      include: {
        images: true,
        category: true,
        size: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
