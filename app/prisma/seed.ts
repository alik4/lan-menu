import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Properties ---
  const hotel = await prisma.property.upsert({
    where: { slug: "hotel" },
    update: {},
    create: { name: "Hotel", slug: "hotel" },
  });

  const suite = await prisma.property.upsert({
    where: { slug: "suite" },
    update: {},
    create: { name: "Suite", slug: "suite" },
  });

  const plaza = await prisma.property.upsert({
    where: { slug: "plaza" },
    update: {},
    create: { name: "Plaza", slug: "plaza" },
  });

  // --- Outlets (8 total) ---
  const outlets = [
    { name: "Dweik", slug: "dweik", propertyId: hotel.id },
    { name: "Room Service - Hotel", slug: "room-service-hotel", propertyId: hotel.id },
    { name: "Znood el Sett", slug: "znood-el-sett", propertyId: suite.id },
    { name: "Room Service - Suite", slug: "room-service-suite", propertyId: suite.id },
    { name: "Fumebar", slug: "fumebar", propertyId: plaza.id },
    { name: "Prime 18", slug: "prime-18", propertyId: plaza.id },
    { name: "Lancs", slug: "lancs", propertyId: plaza.id },
    { name: "Room Service - Plaza", slug: "room-service-plaza", propertyId: plaza.id },
  ];

  const createdOutlets: { [key: string]: string } = {};

  for (const o of outlets) {
    const outlet = await prisma.outlet.upsert({
      where: { slug: o.slug },
      update: {},
      create: o,
    });
    createdOutlets[o.slug] = outlet.id;
  }

  // --- Demo data: sections, categories, items for Dweik ---
  const dweik = await prisma.outlet.findUniqueOrThrow({ where: { slug: "dweik" } });

  const foodSection = await prisma.section.upsert({
    where: { id: "demo-food-dweik" },
    update: {},
    create: {
      id: "demo-food-dweik",
      name: "Food",
      outletId: dweik.id,
      displayOrder: 0,
    },
  });

  const beverageSection = await prisma.section.upsert({
    where: { id: "demo-beverage-dweik" },
    update: {},
    create: {
      id: "demo-beverage-dweik",
      name: "Beverage",
      outletId: dweik.id,
      displayOrder: 1,
    },
  });

  const mainCourse = await prisma.category.upsert({
    where: { id: "demo-main-course-dweik" },
    update: {},
    create: {
      id: "demo-main-course-dweik",
      name: "Main Course",
      sectionId: foodSection.id,
      displayOrder: 0,
    },
  });

  const appetizers = await prisma.category.upsert({
    where: { id: "demo-appetizers-dweik" },
    update: {},
    create: {
      id: "demo-appetizers-dweik",
      name: "Appetizers",
      sectionId: foodSection.id,
      displayOrder: 1,
    },
  });

  const drinks = await prisma.category.upsert({
    where: { id: "demo-drinks-dweik" },
    update: {},
    create: {
      id: "demo-drinks-dweik",
      name: "Drinks",
      sectionId: beverageSection.id,
      displayOrder: 0,
    },
  });

  // Demo items
  const items = [
    { id: "demo-item-1", name: "Grilled Chicken Platter", description: "Char-grilled chicken breast with garlic sauce and fries", price: 12.5, categoryId: mainCourse.id, order: 0 },
    { id: "demo-item-2", name: "Shawarma Wrap", description: "Seasoned meat in pita with tahini and pickles", price: 8.99, categoryId: mainCourse.id, order: 1 },
    { id: "demo-item-3", name: "Hummus & Bread", description: "Creamy hummus with warm pita bread", price: 4.5, categoryId: appetizers.id, order: 0 },
    { id: "demo-item-4", name: "Falafel Plate", description: "Golden fried chickpea fritters with tahini", price: 6.0, categoryId: appetizers.id, order: 1 },
    { id: "demo-item-5", name: "Fresh Orange Juice", description: "Freshly squeezed", price: 3.5, categoryId: drinks.id, order: 0 },
    { id: "demo-item-6", name: "Iced Coffee", description: "Cold brew iced coffee", price: 4.0, categoryId: drinks.id, order: 1 },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.categoryId,
        displayOrder: item.order,
      },
    });
  }

  // --- Admins with roles ---
  // Super admin: full access
  const superAdminHash = await bcrypt.hash("admin123", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: superAdminHash,
      role: "super_admin",
    },
  });

  // Outlet admin: access to specific outlets
  const outletAdminHash = await bcrypt.hash("dweikadmin123", 10);
  const dweikAdmin = await prisma.admin.upsert({
    where: { username: "dweik_admin" },
    update: {},
    create: {
      username: "dweik_admin",
      passwordHash: outletAdminHash,
      role: "outlet_admin",
    },
  });

  // Assign dweik_admin to Dweik outlet only
  await prisma.adminOutlet.upsert({
    where: { adminId_outletId: { adminId: dweikAdmin.id, outletId: dweik.id } },
    update: {},
    create: {
      adminId: dweikAdmin.id,
      outletId: dweik.id,
    },
  });

  console.log("✓ Seed complete!");
  console.log("CHANGE PASSWORDS BEFORE GOING LIVE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
