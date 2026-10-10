/**
 * Regression test for a cross-store IDOR in the dashboard's own detail
 * pages (not the API routes): billboards/[billboardId]/page.tsx,
 * categories/[categoryId]/page.tsx, sizes/[sizeId]/page.tsx and
 * products/[productId]/page.tsx each fetched their record by `id` alone,
 * with no `storeId` filter -- so an authenticated owner of store A could
 * view (and have the edit form populate with) a billboard/category/size/
 * product belonging to store B just by visiting store A's URL prefix with
 * store B's resource id. The mutation API routes already enforce store
 * ownership, so this didn't allow persisting changes to the other store's
 * data, but it did leak it.
 *
 * These pages are plain async Server Components with no Next-specific
 * request APIs (no redirect/headers/cookies), so they can be called
 * directly like the existing route-handler tests do, and their returned
 * element tree inspected for what got passed as `initialData` -- matching
 * this repo's established "call the handler directly against a fake
 * Prisma table" pattern (see tests/helpers/fakePrisma.ts).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeTable } from "../helpers/fakePrisma";

const { fakeDb } = vi.hoisted(() => ({ fakeDb: {} as Record<string, any> }));

vi.mock("@/lib/prismadb", () => ({ default: fakeDb }));

import BillboardPage from "@/app/(dashboard)/[storeId]/(routes)/billboards/[billboardId]/page";
import CategoryPage from "@/app/(dashboard)/[storeId]/(routes)/categories/[categoryId]/page";
import SizePage from "@/app/(dashboard)/[storeId]/(routes)/sizes/[sizeId]/page";
import ProductPage from "@/app/(dashboard)/[storeId]/(routes)/products/[productId]/page";

// Each page's JSX shape is <div><div><ResourceForm initialData={...} /></div></div>.
const formElement = (page: any) => page.props.children.props.children;

// createFakeTable ignores Prisma's `include` option and returns rows as
// seeded, so a `_count` the page code reads off an `include: { _count }`
// query must be seeded directly here -- the real Prisma client populates
// it from the actual relation, this just stands in for that.
beforeEach(() => {
  fakeDb.billboard = createFakeTable([
    {
      id: "bb-a1",
      storeId: "store-a",
      label: "A Billboard",
      imageUrl: "x",
      _count: { categories: 0 },
    },
    {
      id: "bb-b1",
      storeId: "store-b",
      label: "B Billboard",
      imageUrl: "x",
      _count: { categories: 0 },
    },
  ]);
  fakeDb.category = createFakeTable([
    {
      id: "cat-a1",
      storeId: "store-a",
      name: "A Category",
      billboardId: "bb-a1",
      _count: { products: 0 },
    },
    {
      id: "cat-b1",
      storeId: "store-b",
      name: "B Category",
      billboardId: "bb-b1",
      _count: { products: 0 },
    },
  ]);
  fakeDb.size = createFakeTable([
    {
      id: "sz-a1",
      storeId: "store-a",
      name: "Small",
      value: "S",
      _count: { products: 0 },
    },
    {
      id: "sz-b1",
      storeId: "store-b",
      name: "Small",
      value: "S",
      _count: { products: 0 },
    },
  ]);
  fakeDb.product = createFakeTable([
    { id: "pr-a1", storeId: "store-a", name: "A Product", price: 10 },
    { id: "pr-b1", storeId: "store-b", name: "B Product", price: 20 },
  ]);
});

describe("cross-store authorization: dashboard detail pages", () => {
  it("does not leak another store's billboard through the detail page", async () => {
    const page = await BillboardPage({
      params: Promise.resolve({ storeId: "store-a", billboardId: "bb-b1" }),
    });
    expect(formElement(page).props.initialData).toBeNull();
  });

  it("renders a store's own billboard on its detail page", async () => {
    const page = await BillboardPage({
      params: Promise.resolve({ storeId: "store-a", billboardId: "bb-a1" }),
    });
    expect(formElement(page).props.initialData?.id).toBe("bb-a1");
  });

  it("does not leak another store's category through the detail page", async () => {
    const page = await CategoryPage({
      params: Promise.resolve({ storeId: "store-a", categoryId: "cat-b1" }),
    });
    expect(formElement(page).props.initialData).toBeNull();
  });

  it("renders a store's own category on its detail page", async () => {
    const page = await CategoryPage({
      params: Promise.resolve({ storeId: "store-a", categoryId: "cat-a1" }),
    });
    expect(formElement(page).props.initialData?.id).toBe("cat-a1");
  });

  it("does not leak another store's size through the detail page", async () => {
    const page = await SizePage({
      params: Promise.resolve({ storeId: "store-a", sizeId: "sz-b1" }),
    });
    expect(formElement(page).props.initialData).toBeNull();
  });

  it("renders a store's own size on its detail page", async () => {
    const page = await SizePage({
      params: Promise.resolve({ storeId: "store-a", sizeId: "sz-a1" }),
    });
    expect(formElement(page).props.initialData?.id).toBe("sz-a1");
  });

  it("does not leak another store's product through the detail page", async () => {
    const page = await ProductPage({
      params: Promise.resolve({ storeId: "store-a", productId: "pr-b1" }),
    });
    expect(formElement(page).props.initialData).toBeNull();
  });

  it("renders a store's own product on its detail page", async () => {
    const page = await ProductPage({
      params: Promise.resolve({ storeId: "store-a", productId: "pr-a1" }),
    });
    expect(formElement(page).props.initialData?.id).toBe("pr-a1");
  });
});
