import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildProspectPrompt(prospect, mode, context) {
  const recentContentStr = prospect.recentContent
    ? prospect.recentContent
        .map((c) => `"${c.title}" (${c.views} views)`)
        .join(", ")
    : "No recent content data";

  if (mode === "ai_personalized") {
    return `You are an expert influencer outreach specialist. Generate a personalized, engaging direct message to reach out to an influencer.

Prospect Details:
- Name: ${prospect.name}
- Handle: @${prospect.handle}
- Platform: ${prospect.platform}
- Niche: ${prospect.niche || "Unknown"}
- Followers: ${prospect.followersRaw || "Unknown"}
- Engagement Rate: ${prospect.engagementRate || "Unknown"}%
- Recent Content: ${recentContentStr}

Outreach Context:
${context}

Requirements:
1. Keep the message under 150 words
2. Reference specific content from their recent posts
3. Be personalized and genuine
4. Include a clear call-to-action
5. Avoid generic templates
6. Write in first person
7. Do not include any placeholders or brackets

Generate only the message body, no other text.`;
  } else if (mode === "ai_standard") {
    return `You are an influencer outreach specialist. Generate a professional but personable direct message for an influencer outreach campaign.

Prospect Details:
- Name: ${prospect.name}
- Handle: @${prospect.handle}
- Platform: ${prospect.platform}
- Niche: ${prospect.niche || "Unknown"}

Outreach Context:
${context}

Requirements:
1. Keep the message under 150 words
2. Be professional but friendly
3. Include a clear value proposition
4. Include a clear call-to-action
5. Write in first person
6. Do not include any placeholders or brackets

Generate only the message body, no other text.`;
  } else {
    return null;
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { prospects, mode, context, programId } = body;

    if (!Array.isArray(prospects) || !mode || !context) {
      return NextResponse.json(
        { error: "prospects array, mode, and context are required" },
        { status: 400 }
      );
    }

    if (!["ai_personalized", "ai_standard", "custom"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (mode === "custom") {
      return NextResponse.json(
        { error: "Custom mode requires pre-written messages" },
        { status: 400 }
      );
    }

    const messages = [];

    for (const prospect of prospects) {
      try {
        const prompt = buildProspectPrompt(prospect, mode, context);
        if (!prompt) continue;

        const response = await client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        });

        const generatedMessage =
          response.content[0].type === "text"
            ? response.content[0].text.trim()
            : "";

        messages.push({
          prospectId: prospect.id,
          body: generatedMessage,
          mode: mode,
          platform: prospect.platform,
        });
      } catch (err) {
        console.error("Error generating message for prospect:", err);
      }
    }

    if (programId) {
      const program = await prisma.program.findUnique({
        where: { id: programId },
      });

      if (program && program.userId === user.id) {
        const month = new Date().toISOString().slice(0, 7);
        await prisma.usageTracking.upsert({
          where: { userId_month: { userId: user.id, month } },
          update: { aiGenerations: { increment: messages.length } },
          create: { userId: user.id, month, aiGenerations: messages.length },
        });
      }
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
