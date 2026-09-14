import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb, fakeStripe } = vi.hoisted(() => ({
  fakeDb: {} as Record<string, any>,
  fakeStripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@/lib/stripe", () => ({ stripe: fakeStripe }));

import { POST } from "@/app/api/[storeId]/checkout/route";

function checkoutRequest(productIds: string[]) {
  return new Request("http://localhost/api/store-a/checkout", {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
}

describe("cross-store authorization: checkout", () => {
  beforeEach(() => {
    fakeDb.product = createFakeTable([
      {
        id: "product-a1",
        storeId: "store-a",
        name: "A Product",
        price: 10,
        images: [],
      },
      {
        id: "product-b1",
        storeId: "store-b",
        name: "B Product",
        price: 20,
        images: [],
      },
    ]);
    fakeDb.order = createFakeTable([]);
    fakeStripe.checkout.sessions.create.mockReset();
    fakeStripe.checkout.sessions.create.mockResolvedValue({
      url: "https://stripe.example/session",
    });
  });

  it("rejects a checkout mixing another store's product id", async () => {
    const res = await POST(checkoutRequest(["product-a1", "product-b1"]), {
      params: { storeId: "store-a" },
    });

    expect(res.status).toBe(400);
    expect(fakeDb.order.rows()).toHaveLength(0);
    expect(fakeStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects a checkout for only another store's product", async () => {
    const res = await POST(checkoutRequest(["product-b1"]), {
      params: { storeId: "store-a" },
    });

    expect(res.status).toBe(400);
    expect(fakeDb.order.rows()).toHaveLength(0);
  });

  it("allows a checkout entirely within the requested store", async () => {
    const res = await POST(checkoutRequest(["product-a1"]), {
      params: { storeId: "store-a" },
    });

    expect(res.status).toBe(200);
    expect(fakeDb.order.rows()).toHaveLength(1);
    expect(fakeStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
    const call = fakeStripe.checkout.sessions.create.mock.calls[0][0];
    expect(call.line_items).toHaveLength(1);
  });
});
