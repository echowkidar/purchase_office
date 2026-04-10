import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

// DELETE /api/items/:id — Soft delete (AFO only)
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

    const item = await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name,
        action: "ITEM_DELETED",
        entity: "Item",
        entityId: id,
        details: { name: item.name },
      },
    });

    return NextResponse.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
