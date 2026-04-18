import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";

// GET /api/items/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.item.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

// PUT /api/items/:id — Update item (AFO only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { variants, ...itemData } = body;

    const existingItem = await prisma.item.findUnique({ where: { id } });

    // Check if image is updated (or removed via empty string)
    if (existingItem?.mainImage && itemData.mainImage !== undefined && existingItem.mainImage !== itemData.mainImage) {
      if (existingItem.mainImage.startsWith("/uploads/items/")) {
        try {
          const filename = path.basename(existingItem.mainImage);
          const filepath = path.join(process.cwd(), "public", "uploads", "items", filename);
          await fs.unlink(filepath);
        } catch (e) {
          console.error("Failed to delete old image:", e);
        }
      }
    }

    // if mainImage is explicit empty string, we want it as null in DB
    if (itemData.mainImage === "") {
        itemData.mainImage = null;
    }

    // Update item
    const item = await prisma.item.update({
      where: { id },
      data: itemData,
    });

    // Update variants if provided
    if (variants) {
      // Delete existing variants
      await prisma.itemVariant.deleteMany({ where: { itemId: id } });
      // Create new variants
      await prisma.itemVariant.createMany({
        data: variants.map((v: Record<string, string>) => ({ ...v, itemId: id })),
      });
    }

    const updated = await prisma.item.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "ITEM_UPDATED",
        entity: "Item",
        entityId: id,
        details: { name: item.name },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/items/:id — Delete item (AFO only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "AFO_STAFF" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check if the item is referenced in any IndentItem
    const indentCount = await prisma.indentItem.count({
      where: { itemId: id }
    });

    if (indentCount > 0) {
      // It's used in indents, we can only soft delete it
      const item = await prisma.item.update({
        where: { id },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userName: session.user.name,
          action: "ITEM_DEACTIVATED",
          entity: "Item",
          entityId: id,
          details: { name: item.name },
        },
      });

      return NextResponse.json({ message: "Item is used in indents and has been deactivated instead of deleted." });
    }

    // It's not used in indents, find item first to get image path, then hard delete it
    const itemToDelete = await prisma.item.findUnique({
      where: { id },
    });

    if (!itemToDelete) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.item.delete({
      where: { id },
    });

    // Delete image if exists
    if (itemToDelete.mainImage && itemToDelete.mainImage.startsWith("/uploads/items/")) {
      try {
        const filename = path.basename(itemToDelete.mainImage);
        const filepath = path.join(process.cwd(), "public", "uploads", "items", filename);
        await fs.unlink(filepath);
      } catch (e) {
        console.error("Failed to delete item image:", e);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "ITEM_DELETED",
        entity: "Item",
        entityId: id,
        details: { name: itemToDelete.name },
      },
    });

    return NextResponse.json({ message: "Item permanently deleted." });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
