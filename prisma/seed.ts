import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ──────────────────── DEPARTMENTS ────────────────────
  const departments = [
    { name: "Computer Science", code: "CS" },
    { name: "Electronics Engineering", code: "ECE" },
    { name: "Mechanical Engineering", code: "ME" },
    { name: "Civil Engineering", code: "CE" },
    { name: "Electrical Engineering", code: "EE" },
    { name: "Chemical Engineering", code: "CHE" },
    { name: "Library", code: "LIB" },
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Mathematics", code: "MATH" },
    { name: "Botany", code: "BOT" },
    { name: "Zoology", code: "ZOO" },
    { name: "Commerce", code: "COM" },
    { name: "Law", code: "LAW" },
    { name: "Medicine (JNMC)", code: "MED" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log(`✅ ${departments.length} departments seeded`);

  // ──────────────────── ITEM CATEGORIES ────────────────────
  const categories = [
    { name: "Equipment", slug: "equipment" },
    { name: "Furniture", slug: "furniture" },
    { name: "Air Conditioner", slug: "ac" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const result = await prisma.itemCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = result.id;
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // ──────────────────── SAMPLE ITEMS ────────────────────
  const items = [
    // Equipment
    {
      name: "Laptop",
      description: "High performance laptop for academic and research purposes",
      specifications: "Intel Core i5/i7, 8-16GB RAM, 256-512GB SSD, 14-15.6 inch display",
      itemCode: "EQ-LAP-001",
      categoryId: createdCategories["equipment"],
      variants: [
        { label: "i5 - 8GB RAM - 256GB SSD" },
        { label: "i5 - 16GB RAM - 512GB SSD" },
        { label: "i7 - 16GB RAM - 512GB SSD" },
      ],
    },
    {
      name: "Desktop Computer",
      description: "Desktop workstation for labs and offices",
      specifications: "Intel Core i5, 8GB RAM, 500GB SSD, 21.5 inch monitor",
      itemCode: "EQ-DES-001",
      categoryId: createdCategories["equipment"],
      variants: [
        { label: "i5 - 8GB RAM - 500GB SSD" },
        { label: "i5 - 16GB RAM - 1TB SSD" },
        { label: "i7 - 16GB RAM - 1TB SSD" },
      ],
    },
    {
      name: "Printer",
      description: "Office printer for document printing",
      specifications: "Laser / Inkjet, A4/A3, USB + WiFi connectivity",
      itemCode: "EQ-PRT-001",
      categoryId: createdCategories["equipment"],
      variants: [
        { label: "Laser - A4 - B&W" },
        { label: "Laser - A4 - Color" },
        { label: "Inkjet - A3 - Color" },
      ],
    },
    {
      name: "Projector",
      description: "Multimedia projector for classrooms and conference rooms",
      specifications: "3500-5000 lumens, HDMI, VGA, USB",
      itemCode: "EQ-PRJ-001",
      categoryId: createdCategories["equipment"],
      variants: [
        { label: "3500 Lumens - Standard" },
        { label: "5000 Lumens - HD" },
      ],
    },
    {
      name: "Scanner",
      description: "Document scanner for digitization",
      specifications: "Flatbed / ADF, A4/A3",
      itemCode: "EQ-SCN-001",
      categoryId: createdCategories["equipment"],
      variants: [
        { label: "Flatbed - A4" },
        { label: "ADF - A4 - Auto Duplex" },
      ],
    },
    {
      name: "UPS",
      description: "Uninterruptible Power Supply for equipment protection",
      specifications: "600VA - 3KVA, Line Interactive",
      itemCode: "EQ-UPS-001",
      categoryId: createdCategories["equipment"],
      variants: [
        { label: "600VA" },
        { label: "1KVA" },
        { label: "2KVA" },
        { label: "3KVA" },
      ],
    },
    // Furniture
    {
      name: "Office Chair",
      description: "Ergonomic office chair for staff and faculty",
      specifications: "Cushioned seat, armrest, adjustable height",
      itemCode: "FN-CHR-001",
      categoryId: createdCategories["furniture"],
      variants: [
        { label: "Revolving - High Back" },
        { label: "Revolving - Low Back" },
        { label: "Fixed - Visitor" },
        { label: "Executive - Leather" },
      ],
    },
    {
      name: "Computer Table",
      description: "Desk for computer workstation",
      specifications: "Wooden / Metal, with keyboard tray and CPU stand",
      itemCode: "FN-TBL-001",
      categoryId: createdCategories["furniture"],
      variants: [
        { label: "Wooden - Standard" },
        { label: "Wooden - L-Shape" },
        { label: "Metal Frame - Standard" },
      ],
    },
    {
      name: "Almirah / Cabinet",
      description: "Storage cabinet for files and documents",
      specifications: "Steel / Wooden, 3-5 shelves, lockable",
      itemCode: "FN-ALM-001",
      categoryId: createdCategories["furniture"],
      variants: [
        { label: "Steel - 3 Shelf" },
        { label: "Steel - 5 Shelf" },
        { label: "Wooden - 4 Shelf" },
      ],
    },
    // Air Conditioners
    {
      name: "Split AC",
      description: "Split type air conditioner for offices and labs",
      specifications: "Inverter technology, auto-restart, copper condenser",
      itemCode: "AC-SPL-001",
      categoryId: createdCategories["ac"],
      variants: [
        { label: "1 Ton - 3 Star", acType: "Split", tonCapacity: "1", starRating: "3" },
        { label: "1.5 Ton - 3 Star", acType: "Split", tonCapacity: "1.5", starRating: "3" },
        { label: "1.5 Ton - 5 Star", acType: "Split", tonCapacity: "1.5", starRating: "5" },
        { label: "2 Ton - 3 Star", acType: "Split", tonCapacity: "2", starRating: "3" },
        { label: "2 Ton - 5 Star", acType: "Split", tonCapacity: "2", starRating: "5" },
      ],
    },
    {
      name: "Window AC",
      description: "Window type air conditioner",
      specifications: "Standard compressor, easy installation",
      itemCode: "AC-WIN-001",
      categoryId: createdCategories["ac"],
      variants: [
        { label: "1 Ton - 3 Star", acType: "Window", tonCapacity: "1", starRating: "3" },
        { label: "1.5 Ton - 3 Star", acType: "Window", tonCapacity: "1.5", starRating: "3" },
        { label: "2 Ton - 3 Star", acType: "Window", tonCapacity: "2", starRating: "3" },
      ],
    },
  ];

  for (const item of items) {
    const { variants, ...itemData } = item;
    const existing = await prisma.item.findFirst({
      where: { itemCode: itemData.itemCode },
    });

    if (!existing) {
      await prisma.item.create({
        data: {
          ...itemData,
          variants: {
            create: variants,
          },
        },
      });
    }
  }
  console.log(`✅ ${items.length} items with variants seeded`);

  // ──────────────────── DEFAULT USERS ────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const csDept = await prisma.department.findUnique({ where: { code: "CS" } });

  // Super Admin
  await prisma.user.upsert({
    where: { email: "admin@amu.ac.in" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@amu.ac.in",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      designation: "System Administrator",
      phone: "9876543210",
      isActive: true,
    },
  });

  // AFO Staff
  await prisma.user.upsert({
    where: { email: "afo@amu.ac.in" },
    update: {},
    create: {
      name: "AFO Purchase Staff",
      email: "afo@amu.ac.in",
      password: hashedPassword,
      role: "AFO_STAFF",
      designation: "Assistant Finance Officer (Purchase)",
      phone: "9876543211",
      isActive: true,
    },
  });

  // Demo Department User
  const demoPassword = await bcrypt.hash("user123", 12);
  await prisma.user.upsert({
    where: { email: "user@amu.ac.in" },
    update: {},
    create: {
      name: "Dr. Demo User",
      email: "user@amu.ac.in",
      password: demoPassword,
      role: "DEPT_USER",
      departmentId: csDept?.id,
      designation: "Associate Professor",
      phone: "9876543212",
      isActive: true,
    },
  });

  console.log("✅ Default users seeded:");
  console.log("   🔑 Super Admin: admin@amu.ac.in / admin123");
  console.log("   🔑 AFO Staff:   afo@amu.ac.in / admin123");
  console.log("   🔑 Dept User:   user@amu.ac.in / user123");

  console.log("\n🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
