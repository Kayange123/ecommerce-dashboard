import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEB_HOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse("Error with webhook signature: " + error.message, {
      status: 400,
    });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const address = session?.customer_details?.address;

  const addressValue = [
    address?.line1,
    address?.line2,
    address?.postal_code,
    address?.city,
    address?.country,
    address?.state,
  ];

  const addressStr = addressValue.filter((add) => add !== null).join(", ");

  if (event.type === "checkout.session.completed") {
    const alreadyProcessed = await prismadb.processedWebhookEvent.findFirst({
      where: { id: event.id },
    });
    if (alreadyProcessed) {
      return new NextResponse("Event already processed", { status: 200 });
    }

    const order = await prismadb.order.update({
      where: {
        id: session?.metadata?.orderId,
      },
      data: {
        isPaid: true,
        address: addressStr,
        phone: session?.customer_details?.phone || "",
      },
      include: {
        orderItems: true,
      },
    });
    const productIds = order?.orderItems?.map((order) => order?.productId);
    await prismadb.product.updateMany({
      where: {
        id: {
          in: [...productIds],
        },
      },
      data: {
        isArchived: true,
      },
    });

    // Recorded after the side effects above succeed, not before: both
    // side effects are idempotent set-to-a-fixed-value writes, so a crash
    // between them and this insert just costs one harmless extra retry,
    // whereas recording first could permanently mark a not-actually-
    // processed event as done if the process died in between.
    await prismadb.processedWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  }
  return new NextResponse("webhooks provided successfully", { status: 200 });
}
