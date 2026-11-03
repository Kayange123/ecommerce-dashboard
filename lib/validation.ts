import { z } from "zod";

// Server-side request body schemas. Client forms have their own zod
// schemas for UX, but a route handler can't trust that the caller went
// through the form — these are the authoritative checks.

export const productBodySchema = z.object({
  name: z.string().trim().min(1, { error: "name is required" }),
  price: z
    .number({ error: "price must be a number" })
    .positive({ error: "price must be greater than 0" })
    .finite(),
  categoryId: z.string().min(1, { error: "category is required" }),
  sizeId: z.string().min(1, { error: "sizeId is required" }),
  images: z
    .array(z.object({ url: z.string().min(1) }))
    .min(1, { error: "At least one image is required" }),
  isFeatured: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }),
  billboardId: z.string().min(1, { error: "Billboard ID is required" }),
});

export const checkoutBodySchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(1, { error: "ProductIds are required" }),
});

/**
 * Parses a JSON request body against a schema. Malformed JSON is treated
 * the same as a schema mismatch (a 400), rather than letting `req.json()`
 * throw into the handler's generic 500 path.
 */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<
  { success: true; data: z.output<T> } | { success: false; error: string }
> {
  const json = await req.json().catch(() => undefined);
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Invalid request body",
    };
  }
  return { success: true, data: result.data };
}
