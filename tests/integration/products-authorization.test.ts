import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { DELETE, PATCH } from "@/app/api/[storeId]/products/[productId]/route";

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/store-a/products/product-b1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("cross-store authorization: products", () => {
  beforeEach(() => {
    fakeDb.store = createFakeTable([
      { id: "store-a", userId: "user-a" },
      { id: "store-b", userId: "user-b" },
    ]);
    fakeDb.product = createFakeTable([
      { id: "product-a1", storeId: "store-a", name: "A Product", price: 10 },
      { id: "product-b1", storeId: "store-b", name: "B Product", price: 20 },
    ]);
    vi.mocked(auth).mockResolvedValue({ userId: "user-a" } as any);
  });

  it("does not let a user delete another store's product through their own store id", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ storeId: "store-a", productId: "product-b1" }),
    });

    expect(res.status).toBe(404);
    expect(fakeDb.product.rows()).toHaveLength(2);
  });

  it("does not let a user update another store's product through their own store id", async () => {
    const res = await PATCH(
      patchRequest({
        name: "Hacked",
        price: 1,
        categoryId: "cat-1",
        sizeId: "size-1",
        images: [{ url: "http://img.example/1.png" }],
      }),
      {
        params: Promise.resolve({
          storeId: "store-a",
          productId: "product-b1",
        }),
      }
    );

    expect(res.status).toBe(404);
    const untouched = await fakeDb.product.findFirst({
      where: { id: "product-b1" },
    });
    expect(untouched.name).toBe("B Product");
  });

  it("lets a user delete their own store's product", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ storeId: "store-a", productId: "product-a1" }),
    });

    expect(res.status).toBe(200);
    expect(fakeDb.product.rows()).toHaveLength(1);
    expect(fakeDb.product.rows()[0].id).toBe("product-b1");
  });

  it("lets a user update their own store's product", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/store-a/products/product-a1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Renamed",
          price: 15,
          categoryId: "cat-1",
          sizeId: "size-1",
          images: [{ url: "http://img.example/1.png" }],
        }),
      }),
      {
        params: Promise.resolve({
          storeId: "store-a",
          productId: "product-a1",
        }),
      }
    );

    expect(res.status).toBe(200);
    const updated = await fakeDb.product.findFirst({
      where: { id: "product-a1" },
    });
    expect(updated.name).toBe("Renamed");
  });
});
