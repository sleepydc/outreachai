import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await requireAuth();

    const programs = await prisma.program.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("GET programs error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { name, platforms, filters } = body;

    if (!name || !platforms) {
      return NextResponse.json(
        { error: "Name and platforms are required" },
        { status: 400 }
      );
    }

    const program = await prisma.program.create({
      data: {
        userId: user.id,
        name,
        platforms,
        filters: filters || {},
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("POST programs error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
