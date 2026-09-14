/**
 * A minimal in-memory stand-in for a Prisma model delegate, used to unit-test
 * route handler authorization logic without a real database. It implements
 * just enough of the Prisma Client API (findFirst, update, updateMany,
 * deleteMany, create) with real `where`-clause filtering, so a test that
 * calls a route handler exercises the same query shape the handler actually
 * sends to Prisma.
 */
type Row = Record<string, any>;

function matchesValue(actual: unknown, expected: unknown): boolean {
  if (
    expected !== null &&
    typeof expected === "object" &&
    !Array.isArray(expected)
  ) {
    const ops = expected as Record<string, unknown>;
    if ("in" in ops) return (ops.in as unknown[]).includes(actual);
    if ("startsWith" in ops) {
      return (
        typeof actual === "string" &&
        actual.startsWith(ops.startsWith as string)
      );
    }
    // Unsupported operator — fail loudly rather than silently matching
    // everything, so a missing case here is caught by a failing test
    // instead of a false positive.
    throw new Error(
      `fakePrisma: unsupported where operator ${JSON.stringify(expected)}`
    );
  }
  return actual === expected;
}

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    return matchesValue(row[key], value);
  });
}

function scalarFields(patch: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || typeof value !== "object") {
      out[key] = value;
    }
  }
  return out;
}

export function createFakeTable(initialRows: Row[] = []) {
  let rows = [...initialRows];

  return {
    rows: () => rows,
    findFirst: async ({ where }: { where: Row }) => {
      return rows.find((row) => matches(row, where)) ?? null;
    },
    findMany: async ({ where }: { where?: Row } = {}) => {
      return where ? rows.filter((row) => matches(row, where)) : [...rows];
    },
    update: async ({ where, data }: { where: Row; data: Row }) => {
      const row = rows.find((r) => matches(r, where));
      if (!row) {
        const error: any = new Error("Record to update not found.");
        error.code = "P2025";
        throw error;
      }
      Object.assign(row, scalarFields(data));
      return { ...row };
    },
    updateMany: async ({ where, data }: { where: Row; data: Row }) => {
      const matched = rows.filter((row) => matches(row, where));
      matched.forEach((row) => Object.assign(row, scalarFields(data)));
      return { count: matched.length };
    },
    deleteMany: async ({ where }: { where: Row }) => {
      const before = rows.length;
      rows = rows.filter((row) => !matches(row, where));
      return { count: before - rows.length };
    },
    create: async ({ data }: { data: Row }) => {
      const created = { id: data.id ?? crypto.randomUUID(), ...data };
      rows.push(created);
      return created;
    },
  };
}

export function createFakePrisma(seed: Record<string, Row[]>) {
  const tables: Record<string, ReturnType<typeof createFakeTable>> = {};
  for (const [model, rows] of Object.entries(seed)) {
    tables[model] = createFakeTable(rows);
  }
  return tables;
}
