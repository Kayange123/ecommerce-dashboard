import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb, fakeStripe } = vi.hoisted(() => ({
  fakeDb: {} as Record<string, any>,
  fakeStripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        listLineItems: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@/lib/stripe", () => ({ stripe: fakeStripe }));

import { POST } from "@/app/api/webhook/route";

function webhookRequest() {
  return new Request("http://localhost/api/webhook", {
    method: "POST",
    headers: { "stripe-signature": "test-signature" },
    body: "{}",
  });
}

const EVENT = {
  id: "evt_test_123",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_1",
      metadata: { orderId: "order-1" },
      customer_details: { address: {}, phone: "" },
    },
  },
};

function seedOrderAndProducts() {
  fakeDb.order = createFakeTable([
    {
      id: "order-1",
      storeId: "store-a",
      isPaid: false,
      orderItems: [{ productId: "product-1" }, { productId: "product-2" }],
    },
  ]);
  fakeDb.product = createFakeTable([
    { id: "product-1", storeId: "store-a", isArchived: false },
    { id: "product-2", storeId: "store-a", isArchived: false },
  ]);
  fakeDb.orderItem = createFakeTable([
    {
      id: "oi-1",
      orderId: "order-1",
      productId: "product-1",
      quantity: 1,
      stripeLineItemId: "li_1",
    },
    {
      id: "oi-2",
      orderId: "order-1",
      productId: "product-2",
      quantity: 1,
      stripeLineItemId: "li_2",
    },
  ]);
}

describe("webhook idempotency", () => {
  beforeEach(() => {
    seedOrderAndProducts();
    fakeDb.processedWebhookEvent = createFakeTable([]);
    fakeStripe.webhooks.constructEvent.mockReset();
    fakeStripe.webhooks.constructEvent.mockReturnValue(EVENT);
    fakeStripe.checkout.sessions.listLineItems.mockReset();
    fakeStripe.checkout.sessions.listLineItems.mockResolvedValue({
      data: [
        { id: "li_1", quantity: 3 },
        { id: "li_2", quantity: 1 },
      ],
    });
  });

  it("marks the order paid and archives its products on first delivery", async () => {
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    const order = await fakeDb.order.findFirst({ where: { id: "order-1" } });
    expect(order.isPaid).toBe(true);
    const products = await fakeDb.product.findMany();
    expect(products.every((p: any) => p.isArchived)).toBe(true);
    expect(fakeDb.processedWebhookEvent.rows()).toHaveLength(1);
    expect(fakeDb.processedWebhookEvent.rows()[0].id).toBe(EVENT.id);
  });

  it("backfills the final quantity per order item from Stripe's line items", async () => {
    await POST(webhookRequest());

    const item1 = await fakeDb.orderItem.findFirst({
      where: { id: "oi-1" },
    });
    const item2 = await fakeDb.orderItem.findFirst({
      where: { id: "oi-2" },
    });
    expect(item1.quantity).toBe(3); // customer bumped quantity in Stripe's UI
    expect(item2.quantity).toBe(1);
  });

  it("does not reprocess a retried delivery of the same event", async () => {
    await POST(webhookRequest());

    // Reset product/order state to prove a second delivery of the SAME
    // event doesn't touch it again — a retry landing here should be a
    // pure no-op, not a second archive/mark-paid pass.
    seedOrderAndProducts();

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    const order = await fakeDb.order.findFirst({ where: { id: "order-1" } });
    expect(order.isPaid).toBe(false);
    const products = await fakeDb.product.findMany();
    expect(products.every((p: any) => p.isArchived === false)).toBe(true);
    expect(fakeDb.processedWebhookEvent.rows()).toHaveLength(1);
  });

  it("returns 400 on an invalid webhook signature", async () => {
    fakeStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("signature mismatch");
    });

    const res = await POST(webhookRequest());
    expect(res.status).toBe(400);
  });
});
