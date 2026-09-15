import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import {
  DELETE,
  PATCH,
} from "@/app/api/[storeId]/billboards/[billboardId]/route";

describe("cross-store authorization: billboards", () => {
  beforeEach(() => {
    fakeDb.store = createFakeTable([
      { id: "store-a", userId: "user-a" },
      { id: "store-b", userId: "user-b" },
    ]);
    fakeDb.billboard = createFakeTable([
      {
        id: "bb-a1",
        storeId: "store-a",
        label: "A Billboard",
        imageUrl: "http://img/a.png",
      },
      {
        id: "bb-b1",
        storeId: "store-b",
        label: "B Billboard",
        imageUrl: "http://img/b.png",
      },
    ]);
    vi.mocked(auth).mockResolvedValue({ userId: "user-a" } as any);
  });

  it("does not let a user delete another store's billboard through their own store id", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: { storeId: "store-a", billboardId: "bb-b1" },
    });

    expect(res.status).toBe(404);
    expect(fakeDb.billboard.rows()).toHaveLength(2);
  });

  it("does not let a user update another store's billboard through their own store id", async () => {
    const res = await PATCH(
      new Request("http://localhost/api/store-a/billboards/bb-b1", {
        method: "PATCH",
        body: JSON.stringify({
          label: "Hacked",
          imageUrl: "http://img/hacked.png",
        }),
      }),
      { params: { storeId: "store-a", billboardId: "bb-b1" } }
    );

    expect(res.status).toBe(404);
    const untouched = await fakeDb.billboard.findFirst({
      where: { id: "bb-b1" },
    });
    expect(untouched.label).toBe("B Billboard");
  });

  it("lets a user delete their own store's billboard", async () => {
    const res = await DELETE(new Request("http://localhost"), {
      params: { storeId: "store-a", billboardId: "bb-a1" },
    });

    expect(res.status).toBe(200);
    expect(fakeDb.billboard.rows()).toHaveLength(1);
  });
});
