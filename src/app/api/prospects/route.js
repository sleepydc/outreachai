import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json(
        { error: "programId query parameter is required" },
        { status: 400 }
      );
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program || program.userId !== user.id) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    const prospects = await prisma.prospect.findMany({
      where: { programId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prospects);
  } catch (error) {
    console.error("GET prospects error:", error);
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

    const { programId, prospects } = body;

    if (!programId || !Array.isArray(prospects)) {
      return NextResponse.json(
        { error: "programId and prospects array are required" },
        { status: 400 }
      );
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program || program.userId !== user.id) {
      return NextResponse.json(
        { error: "Program not found" },
        { status: 404 }
      );
    }

    const created = [];

    for (const prospect of prospects) {
      try {
        const newProspect = await prisma.prospect.upsert({
          where: {
            programId_handle_platform: {
              programId,
              handle: prospect.handle,
              platform: prospect.platform,
            },
          },
          update: {
            name: prospect.name,
            followersRaw: prospect.followersRaw,
            engagementRate: prospect.engagementRate,
            niche: prospect.niche,
            score: prospect.score,
            verified: prospect.verified,
            recentContent: prospect.recentContent || null,
            linkedHandles: prospect.linkedHandles || null,
            sourcePlatform: prospect.sourcePlatform || null,
            rawScrapedData: prospect.rawScrapedData || null,
          },
          create: {
            programId,
            name: prospect.name,
            handle: prospect.handle,
            platform: prospect.platform,
            followersRaw: prospect.followersRaw,
            engagementRate: prospect.engagementRate,
            niche: prospect.niche,
            score: prospect.score,
            verified: prospect.verified,
            recentContent: prospect.recentContent || null,
            linkedHandles: prospect.linkedHandles || null,
            sourcePlatform: prospect.sourcePlatform || null,
            rawScrapedData: prospect.rawScrapedData || null,
          },
        });

        created.push(newProspect);
      } catch (err) {
        console.error("Error upserting prospect:", err);
      }
    }

    await prisma.program.update({
      where: { id: programId },
      data: {
        prospectsCount: {
          increment: created.length,
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST prospects error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
