import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getOutreachWithAuth(messageId, user) {
  const message = await prisma.outreachMessage.findUnique({
    where: { id: messageId },
    include: { program: true, prospect: true },
  });

  if (!message || message.program.userId !== user.id) {
    return null;
  }

  return message;
}

export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const message = await getOutreachWithAuth(id, user);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("GET outreach error:", error);
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
    const message = await getOutreachWithAuth(id, user);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const { replyStatus, dealStage, notes, nudge } = body;
    const updateData = {};

    if (replyStatus) {
      updateData.replyStatus = replyStatus;
      if (replyStatus === "interested") {
        updateData.respondedAt = new Date();
      }
    }

    if (dealStage) {
      updateData.dealStage = dealStage;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (nudge && nudge.body) {
      const currentHistory = message.messageHistory || [];
      currentHistory.push({
        body: nudge.body,
        sentAt: new Date().toISOString(),
        isNudge: true,
      });
      updateData.messageHistory = currentHistory;
      updateData.latestMessage = nudge.body;
      updateData.nudgeCount = (message.nudgeCount || 0) + 1;
    }

    const updated = await prisma.outreachMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT outreach error:", error);
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
    const message = await getOutreachWithAuth(id, user);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.outreachMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE outreach error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
