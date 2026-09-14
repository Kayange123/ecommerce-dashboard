import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@clerk/nextjs", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs";
import {
  DELETE,
  PATCH,
} from "@/app/api/[storeId]/categories/[categoryId]/route";

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
    vi.mocked(auth).mockReturnValue({ userId: "user-a" } as any);
  });

  it("does not let a user delete another store's category through their own store id", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: { storeId: "store-a", categoryId: "cat-b1" },
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
      { params: { storeId: "store-a", categoryId: "cat-b1" } }
    );

    expect(res.status).toBe(404);
    const untouched = await fakeDb.category.findFirst({
      where: { id: "cat-b1" },
    });
    expect(untouched.name).toBe("B Category");
  });

  it("lets a user delete their own store's category", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: { storeId: "store-a", categoryId: "cat-a1" },
    });

    expect(res.status).toBe(200);
    expect(fakeDb.category.rows()).toHaveLength(1);
  });
});
