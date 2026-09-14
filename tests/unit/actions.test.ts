import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));

import {
  getGraphRevenue,
  getStockSize,
  getTotalRevenue,
  getTotalSales,
} from "@/actions/actions";

// The fake `order` table doesn't do real relational includes, so each row
// carries its own already-joined `orderItems` (each with an embedded
// `product`) exactly as `include: { orderItems: { include: { product: true } } }`
// would return from a real Prisma query.
function order(overrides: Record<string, any>) {
  return {
    storeId: "store-a",
    isPaid: true,
    createdAt: new Date("2026-03-15"),
    orderItems: [],
    ...overrides,
  };
}

function item(price: number, quantity: number) {
  return { quantity, product: { price } };
}

describe("actions/actions.ts", () => {
  beforeEach(() => {
    fakeDb.product = createFakeTable([]);
  });

  describe("getTotalRevenue", () => {
    it("multiplies unit price by quantity, not just counting line items", async () => {
      fakeDb.order = createFakeTable([
        order({ id: "o1", orderItems: [item(10, 3)] }), // 3 units at $10 = $30, not $10
      ]);

      expect(await getTotalRevenue("store-a")).toBe(30);
    });

    it("sums across multiple order items and multiple orders", async () => {
      fakeDb.order = createFakeTable([
        order({ id: "o1", orderItems: [item(10, 2), item(5, 1)] }), // 25
        order({ id: "o2", orderItems: [item(20, 1)] }), // 20
      ]);

      expect(await getTotalRevenue("store-a")).toBe(45);
    });

    it("only counts orders scoped to the given store", async () => {
      fakeDb.order = createFakeTable([
        order({ id: "o1", storeId: "store-a", orderItems: [item(10, 1)] }),
      ]);

      expect(await getTotalRevenue("store-b")).toBe(0);
    });
  });

  describe("getTotalSales", () => {
    it("counts only paid orders for the store", async () => {
      fakeDb.order = createFakeTable([
        order({ id: "o1", isPaid: true }),
        order({ id: "o2", isPaid: false }),
        order({ id: "o3", isPaid: true, storeId: "store-b" }),
      ]);

      expect(await getTotalSales("store-a")).toBe(1);
    });
  });

  describe("getStockSize", () => {
    it("counts only non-archived products for the store", async () => {
      fakeDb.product = createFakeTable([
        { id: "p1", storeId: "store-a", isArchived: false },
        { id: "p2", storeId: "store-a", isArchived: true },
        { id: "p3", storeId: "store-b", isArchived: false },
      ]);

      expect(await getStockSize("store-a")).toBe(1);
    });
  });

  describe("getGraphRevenue", () => {
    it("buckets revenue by month and multiplies by quantity", async () => {
      fakeDb.order = createFakeTable([
        order({
          id: "o1",
          createdAt: new Date("2026-01-10"),
          orderItems: [item(10, 2)], // Jan: 20
        }),
        order({
          id: "o2",
          createdAt: new Date("2026-01-20"),
          orderItems: [item(5, 1)], // Jan: +5 = 25
        }),
        order({
          id: "o3",
          createdAt: new Date("2026-03-01"),
          orderItems: [item(100, 1)], // Mar: 100
        }),
      ]);

      const graph = await getGraphRevenue("store-a");
      expect(graph.find((m) => m.name === "Jan")?.total).toBe(25);
      expect(graph.find((m) => m.name === "Mar")?.total).toBe(100);
      expect(graph.find((m) => m.name === "Dec")?.total).toBe(0);
    });
  });
});
