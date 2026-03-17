import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getProgramWithAuth(programId, user) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!program || program.userId !== user.id) {
    return null;
  }

  return program;
}

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const program = await getProgramWithAuth(id, user);

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("GET program error:", error);
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

    const program = await getProgramWithAuth(id, user);

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    const { name, platforms, filters, status } = body;

    const updated = await prisma.program.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(platforms && { platforms }),
        ...(filters && { filters }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT program error:", error);
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

    const program = await getProgramWithAuth(id, user);

    if (!program) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    await prisma.program.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE program error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
