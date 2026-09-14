import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@clerk/nextjs", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs";
import { DELETE, PATCH } from "@/app/api/[storeId]/sizes/[sizeId]/route";

describe("cross-store authorization: sizes", () => {
  beforeEach(() => {
    fakeDb.store = createFakeTable([
      { id: "store-a", userId: "user-a" },
      { id: "store-b", userId: "user-b" },
    ]);
    fakeDb.size = createFakeTable([
      { id: "size-a1", storeId: "store-a", name: "Small", value: "S" },
      { id: "size-b1", storeId: "store-b", name: "Large", value: "L" },
    ]);
    vi.mocked(auth).mockReturnValue({ userId: "user-a" } as any);
  });

  it("does not let a user delete another store's size through their own store id", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: { storeId: "store-a", sizeId: "size-b1" },
    });

    expect(res.status).toBe(404);
    expect(fakeDb.size.rows()).toHaveLength(2);
  });

  it("does not let a user rename another store's size through their own store id", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/store-a/sizes/size-b1", {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacked", value: "XL" }),
      }),
      { params: { storeId: "store-a", sizeId: "size-b1" } }
    );

    expect(res.status).toBe(404);
    const untouched = await fakeDb.size.findFirst({ where: { id: "size-b1" } });
    expect(untouched.name).toBe("Large");
  });

  it("lets a user delete their own store's size", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: { storeId: "store-a", sizeId: "size-a1" },
    });

    expect(res.status).toBe(200);
    expect(fakeDb.size.rows()).toHaveLength(1);
  });
});
