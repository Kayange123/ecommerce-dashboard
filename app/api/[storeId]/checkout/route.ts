import Stripe from "stripe";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // allow requests from any other domain
  "Access-Control-Allow-Methods": "GET,HEAD,PUT,OPTIONS,POST,DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const { productIds } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("ProductIds are required", { status: 400 });
  }

  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    include: {
      images: true,
    },
  });

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  products.forEach((item) => {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: "USD",
        product_data: {
          name: item.name,
          images: item.images.map((image) => image.url),
        },
        unit_amount: Number(item.price) * 100,
      },
      adjustable_quantity: {
        enabled: true,
        minimum: 1,
      },
    });
  });

  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: productIds.map((productId: string) => ({
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
    },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      submit_type: "pay",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      cancel_url: `${process.env.NEXT_PUBLIC_STORE_URL}/cart?canceled=1`,
      success_url: `${process.env.NEXT_PUBLIC_STORE_URL}/cart?success=1`,
      metadata: {
        orderId: order.id,
      },
    });
    return NextResponse.json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    return new NextResponse("Failed to create create a payment", {
      status: 500,
      statusText: "server error",
    });
  }
}
