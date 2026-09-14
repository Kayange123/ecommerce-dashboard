/**
 * Development seed data.
 *
 * Stores are owned by a single Clerk user id (Store.userId) — there is no
 * organization/team model yet — so seeded stores are only reachable by
 * whichever Clerk account owns them. Set SEED_CLERK_USER_ID in .env to your
 * own Clerk user id (sign in once, then copy it from the Clerk dashboard)
 * before running this script.
 *
 * `npm run db:seed`  — creates the demo data if it doesn't already exist.
 * `npm run db:reset` — deletes any existing demo data first, then recreates it.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PREFIX = "Demo:";

// Cloudinary's public "demo" cloud, used with the `fetch` delivery type to
// proxy stable placeholder images. This keeps every seeded image URL on the
// res.cloudinary.com host that next.config.js already whitelists, without
// requiring a real Cloudinary account for local development.
function demoImage(seed: string) {
  const remote = encodeURIComponent(
    `https://picsum.photos/seed/${seed}/800/800`
  );
  return `https://res.cloudinary.com/demo/image/fetch/${remote}`;
}

const APPAREL_PRODUCTS = [
  "Classic T-Shirt",
  "Pullover Hoodie",
  "Slim Fit Jeans",
  "Denim Jacket",
  "Canvas Sneakers",
  "Wool Beanie",
  "Silk Scarf",
  "Leather Belt",
  "Cable Knit Sweater",
  "Cargo Shorts",
  "Summer Dress",
  "Tailored Blazer",
  "Ribbed Socks (3-Pack)",
  "Knit Beanie",
  "Fleece Gloves",
  "Aviator Sunglasses",
  "Canvas Backpack",
  "Leather Wallet",
  "Chronograph Watch",
  "Suede Sandals",
];

const HOME_PRODUCTS = [
  "Ceramic Mug Set",
  "Velvet Throw Pillow",
  "Brass Table Lamp",
  "Minimalist Wall Clock",
  "Wool Area Rug",
  "Soy Wax Candle",
  "Oak Picture Frame",
  "Acacia Wood Tray",
  "Terracotta Plant Pot",
  "Chunky Knit Blanket",
  "Bamboo Cutting Board",
  "Glass Vase",
  "Wine Glass Set (4-Pack)",
  "Woven Storage Basket",
  "Egyptian Cotton Towel",
  "Linen Bed Sheet Set",
  "Round Coffee Table",
  "Ladder Bookshelf",
  "Rattan Wall Mirror",
  "Blackout Curtain Panel",
];

const CATEGORY_NAMES = [
  "New Arrivals",
  "Best Sellers",
  "On Sale",
  "Seasonal",
  "Essentials",
];
const SIZE_OPTIONS = [
  { name: "Small", value: "S" },
  { name: "Medium", value: "M" },
  { name: "Large", value: "L" },
  { name: "Extra Large", value: "XL" },
];

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function deleteDemoData() {
  const demoStores = await prisma.store.findMany({
    where: { name: { startsWith: DEMO_PREFIX } },
  });

  for (const store of demoStores) {
    const products = await prisma.product.findMany({
      where: { storeId: store.id },
    });
    const productIds = products.map((p) => p.id);

    await prisma.image.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.orderItem.deleteMany({
      where: { productId: { in: productIds } },
    });
    await prisma.order.deleteMany({ where: { storeId: store.id } });
    await prisma.product.deleteMany({ where: { storeId: store.id } });
    await prisma.category.deleteMany({ where: { storeId: store.id } });
    await prisma.billboard.deleteMany({ where: { storeId: store.id } });
    await prisma.size.deleteMany({ where: { storeId: store.id } });
    await prisma.store.delete({ where: { id: store.id } });
  }

  if (demoStores.length > 0) {
    console.log(`Removed ${demoStores.length} existing demo store(s).`);
  }
}

async function seedStore(
  userId: string,
  storeName: string,
  productNames: string[]
) {
  const store = await prisma.store.create({
    data: { name: storeName, userId },
  });

  const billboards = await Promise.all(
    ["Storewide Sale", "New Collection"].map((label, i) =>
      prisma.billboard.create({
        data: {
          storeId: store.id,
          label,
          imageUrl: demoImage(`${storeName}-billboard-${i}`),
        },
      })
    )
  );

  const categories = await Promise.all(
    CATEGORY_NAMES.map((name, i) =>
      prisma.category.create({
        data: {
          storeId: store.id,
          name,
          billboardId: billboards[i % billboards.length].id,
        },
      })
    )
  );

  const sizes = await Promise.all(
    SIZE_OPTIONS.map((size) =>
      prisma.size.create({
        data: { storeId: store.id, name: size.name, value: size.value },
      })
    )
  );

  const products = [];
  for (let i = 0; i < productNames.length; i++) {
    const name = productNames[i];
    const isArchived = Math.random() < 0.1;
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        price: randomBetween(15, 180),
        categoryId: pick(categories).id,
        sizeId: pick(sizes).id,
        isFeatured: i < 4,
        isArchived,
        images: {
          createMany: {
            data: [
              { url: demoImage(`${storeName}-${name}-1`) },
              { url: demoImage(`${storeName}-${name}-2`) },
            ],
          },
        },
      },
    });
    products.push(product);
  }

  const addresses = [
    "12 Baobab Street, Dar es Salaam, Tanzania",
    "48 Kenyatta Avenue, Nairobi, Kenya",
    "200 Main St, Austin, TX, USA",
    "9 Rue de Rivoli, Paris, France",
  ];

  for (let i = 0; i < 10; i++) {
    const isPaid = Math.random() < 0.7;
    const orderProducts = [pick(products), pick(products), pick(products)];
    await prisma.order.create({
      data: {
        storeId: store.id,
        isPaid,
        phone: isPaid ? "+255 712 345 678" : "",
        address: isPaid ? pick(addresses) : "",
        orderItems: {
          create: orderProducts.map((p) => ({
            product: { connect: { id: p.id } },
          })),
        },
      },
    });
  }

  return store;
}

async function main() {
  const shouldReset = process.argv.includes("--reset");
  const userId = process.env.SEED_CLERK_USER_ID;

  if (!userId) {
    console.error(
      "\nSEED_CLERK_USER_ID is not set.\n" +
        "Sign in to the app once, copy your Clerk user id from the Clerk dashboard " +
        "(Users tab), and set SEED_CLERK_USER_ID in your .env file before seeding.\n"
    );
    process.exit(1);
  }

  if (shouldReset) {
    await deleteDemoData();
  } else {
    const existing = await prisma.store.findFirst({
      where: { name: { startsWith: DEMO_PREFIX } },
    });
    if (existing) {
      console.log(
        "Demo data already exists. Run `npm run db:reset` to recreate it."
      );
      return;
    }
  }

  const apparel = await seedStore(
    userId,
    `${DEMO_PREFIX} Apparel Co`,
    APPAREL_PRODUCTS
  );
  const home = await seedStore(
    userId,
    `${DEMO_PREFIX} Home & Living`,
    HOME_PRODUCTS
  );

  console.log(
    `Seeded "${apparel.name}" and "${home.name}" for Clerk user ${userId}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
