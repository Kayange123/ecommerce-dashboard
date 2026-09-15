import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, price, images, isFeatured, isArchived, categoryId, sizeId } =
      body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!name) return new NextResponse("name is required", { status: 400 });
    if (!price) return new NextResponse("price is required", { status: 400 });
    if (!categoryId)
      return new NextResponse("category is required", { status: 400 });
    if (!sizeId) return new NextResponse("sizeId is required", { status: 400 });
    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 });
    if (!images || !images.length) {
      return new NextResponse("At least one image is required", {
        status: 400,
      });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const productByStoreId = await prismadb.product.findFirst({
      where: {
        id: params.productId,
        storeId: params.storeId,
      },
    });
    if (!productByStoreId)
      return new NextResponse("Not Found", { status: 404 });

    await prismadb.product.update({
      where: {
        id: params.productId,
      },
      data: {
        name,
        price,
        isFeatured,
        isArchived,
        categoryId,
        sizeId,
        images: {
          deleteMany: {},
        },
      },
    });

    const product = await prismadb.product.update({
      where: {
        id: params.productId,
      },
      data: {
        images: {
          createMany: {
            data: [...images.map((image: { url: string }) => image)],
          },
        },
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function DELETE(
  _req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const product = await prismadb.product.deleteMany({
      where: {
        id: params.productId,
        storeId: params.storeId,
      },
    });
    if (product.count === 0)
      return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
export async function GET(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await prismadb.product.findFirst({
      where: {
        id: params.productId,
      },
      include: {
        images: true,
        category: true,
        size: true,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
