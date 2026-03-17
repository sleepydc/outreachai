import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");
    const replyStatus = searchParams.get("replyStatus");

    let where = {};

    if (programId) {
      const program = await prisma.program.findUnique({
        where: { id: programId },
      });

      if (!program || program.userId !== user.id) {
        return NextResponse.json(
          { error: "Program not found" },
          { status: 404 }
        );
      }

      where.programId = programId;
    } else {
      const programs = await prisma.program.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      const programIds = programs.map((p) => p.id);
      where.programId = { in: programIds };
    }

    if (replyStatus) {
      where.replyStatus = replyStatus;
    }

    const messages = await prisma.outreachMessage.findMany({
      where,
      include: {
        prospect: true,
        program: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET outreach error:", error);
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

    const { programId, messages } = body;

    if (!programId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "programId and messages array are required" },
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

    for (const msg of messages) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: msg.prospectId },
      });

      if (!prospect || prospect.programId !== programId) {
        continue;
      }

      const outreachMsg = await prisma.outreachMessage.create({
        data: {
          prospectId: msg.prospectId,
          programId,
          platform: msg.platform || prospect.platform,
          handle: prospect.handle,
          mode: msg.mode,
          latestMessage: msg.body,
          messageHistory: [
            {
              body: msg.body,
              sentAt: new Date().toISOString(),
              isNudge: false,
            },
          ],
          sentAt: new Date(),
        },
      });

      created.push(outreachMsg);
    }

    await prisma.program.update({
      where: { id: programId },
      data: {
        contactedCount: {
          increment: created.length,
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST outreach error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
