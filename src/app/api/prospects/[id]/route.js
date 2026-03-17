import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getProspectWithAuth(prospectId, user) {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { program: true },
  });

  if (!prospect || prospect.program.userId !== user.id) {
    return null;
  }

  return prospect;
}

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const prospect = await getProspectWithAuth(id, user);

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("GET prospect error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const body = await request.json();
    const prospect = await getProspectWithAuth(id, user);

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const { status } = body;
    const updated = await prisma.prospect.update({
      where: { id },
      data: { ...(status && { status }) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT prospect error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const prospect = await getProspectWithAuth(id, user);

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE prospect error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
