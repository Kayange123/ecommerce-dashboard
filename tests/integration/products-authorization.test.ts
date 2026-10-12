import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { DELETE, PATCH } from "@/app/api/[storeId]/products/[productId]/route";
import { POST } from "@/app/api/[storeId]/products/route";

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
    fakeDb.category = createFakeTable([
      { id: "cat-1", storeId: "store-a", name: "A Category" },
      { id: "cat-b", storeId: "store-b", name: "B Category" },
    ]);
    fakeDb.size = createFakeTable([
      { id: "size-1", storeId: "store-a", name: "A Size" },
      { id: "size-b", storeId: "store-b", name: "B Size" },
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

  const validBody = {
    name: "New Product",
    price: 19.99,
    categoryId: "cat-1",
    sizeId: "size-1",
    images: [{ url: "http://img.example/1.png" }],
  };

  function postRequest(body: unknown) {
    return new Request("http://localhost/api/store-a/products", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  it("does not let a user attach another store's category to their own product", async () => {
    const res = await PATCH(
      patchRequest({ ...validBody, categoryId: "cat-b" }),
      {
        params: Promise.resolve({
          storeId: "store-a",
          productId: "product-a1",
        }),
      }
    );

    expect(res.status).toBe(400);
    const untouched = await fakeDb.product.findFirst({
      where: { id: "product-a1" },
    });
    expect(untouched.name).toBe("A Product");
  });

  it("does not let a user create a product with another store's size", async () => {
    const res = await POST(postRequest({ ...validBody, sizeId: "size-b" }), {
      params: Promise.resolve({ storeId: "store-a" }),
    });

    expect(res.status).toBe(400);
    expect(fakeDb.product.rows()).toHaveLength(2);
  });

  it("does not let a user create a product with another store's category", async () => {
    const res = await POST(postRequest({ ...validBody, categoryId: "cat-b" }), {
      params: Promise.resolve({ storeId: "store-a" }),
    });

    expect(res.status).toBe(400);
    expect(fakeDb.product.rows()).toHaveLength(2);
  });

  it("lets a user create a product with their own store's category and size", async () => {
    const res = await POST(postRequest(validBody), {
      params: Promise.resolve({ storeId: "store-a" }),
    });

    expect(res.status).toBe(200);
    expect(fakeDb.product.rows()).toHaveLength(3);
  });

  it.each([
    ["a negative price", { ...validBody, price: -5 }],
    ["a zero price", { ...validBody, price: 0 }],
    ["a string price", { ...validBody, price: "10" }],
    ["no images", { ...validBody, images: [] }],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await POST(postRequest(body), {
      params: Promise.resolve({ storeId: "store-a" }),
    });

    expect(res.status).toBe(400);
    expect(fakeDb.product.rows()).toHaveLength(2);
  });
});
