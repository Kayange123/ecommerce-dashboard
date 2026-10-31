import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import {
  DELETE,
  PATCH,
} from "@/app/api/[storeId]/categories/[categoryId]/route";
import { POST } from "@/app/api/[storeId]/categories/route";

function jsonRequest(method: string, body: unknown) {
  return new Request("http://localhost/api/store-a/categories", {
    method,
    body: JSON.stringify(body),
  });
}

describe("cross-store authorization: categories", () => {
  beforeEach(() => {
    fakeDb.store = createFakeTable([
      { id: "store-a", userId: "user-a" },
      { id: "store-b", userId: "user-b" },
    ]);
    fakeDb.category = createFakeTable([
      {
        id: "cat-a1",
        storeId: "store-a",
        name: "A Category",
        billboardId: "bb-a",
      },
      {
        id: "cat-b1",
        storeId: "store-b",
        name: "B Category",
        billboardId: "bb-b",
      },
    ]);
    fakeDb.billboard = createFakeTable([
      { id: "bb-a", storeId: "store-a", label: "A Billboard" },
      { id: "bb-b", storeId: "store-b", label: "B Billboard" },
    ]);
    vi.mocked(auth).mockResolvedValue({ userId: "user-a" } as any);
  });

  it("does not let a user delete another store's category through their own store id", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ storeId: "store-a", categoryId: "cat-b1" }),
    });

    expect(res.status).toBe(404);
    expect(fakeDb.category.rows()).toHaveLength(2);
  });

  it("does not let a user rename another store's category through their own store id", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/store-a/categories/cat-b1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacked", billboardId: "bb-b" }),
      }),
      { params: Promise.resolve({ storeId: "store-a", categoryId: "cat-b1" }) }
    );

    expect(res.status).toBe(404);
    const untouched = await fakeDb.category.findFirst({
      where: { id: "cat-b1" },
    });
    expect(untouched.name).toBe("B Category");
  });

  it("lets a user delete their own store's category", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ storeId: "store-a", categoryId: "cat-a1" }),
    });

    expect(res.status).toBe(200);
    expect(fakeDb.category.rows()).toHaveLength(1);
  });

  it("does not let a user point their own category at another store's billboard", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", { name: "Renamed", billboardId: "bb-b" }),
      { params: Promise.resolve({ storeId: "store-a", categoryId: "cat-a1" }) }
    );

    expect(res.status).toBe(400);
    const untouched = await fakeDb.category.findFirst({
      where: { id: "cat-a1" },
    });
    expect(untouched.billboardId).toBe("bb-a");
    expect(untouched.name).toBe("A Category");
  });

  it("does not let a user create a category on another store's billboard", async () => {
    const res = await POST(
      jsonRequest("POST", { name: "New", billboardId: "bb-b" }),
      { params: Promise.resolve({ storeId: "store-a" }) }
    );

    expect(res.status).toBe(400);
    expect(fakeDb.category.rows()).toHaveLength(2);
  });

  it("lets a user create a category on their own store's billboard", async () => {
    const res = await POST(
      jsonRequest("POST", { name: "New", billboardId: "bb-a" }),
      { params: Promise.resolve({ storeId: "store-a" }) }
    );

    expect(res.status).toBe(200);
    expect(fakeDb.category.rows()).toHaveLength(3);
  });

  it("lets a user update their own category with their own billboard", async () => {
    const res = await PATCH(
      jsonRequest("PATCH", { name: "Renamed", billboardId: "bb-a" }),
      { params: Promise.resolve({ storeId: "store-a", categoryId: "cat-a1" }) }
    );

    expect(res.status).toBe(200);
    const updated = await fakeDb.category.findFirst({
      where: { id: "cat-a1" },
    });
    expect(updated.name).toBe("Renamed");
  });

  it("rejects a malformed body with 400 rather than 500", async () => {
    const res = await POST(
      new Request("http://localhost/api/store-a/categories", {
        method: "POST",
        body: "not json",
      }),
      { params: Promise.resolve({ storeId: "store-a" }) }
    );

    expect(res.status).toBe(400);
  });
});
