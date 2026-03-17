import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const programId = searchParams.get("programId");

    let where = {};

    if (jobId) {
      where.id = jobId;
    } else if (programId) {
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
    }

    const jobs = await prisma.scanJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("GET scan jobs error:", error);
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

    const { programId } = body;

    if (!programId) {
      return NextResponse.json(
        { error: "programId is required" },
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

    const scanJob = await prisma.scanJob.create({
      data: {
        programId,
        status: "running",
        platformsTotal: Array.isArray(program.platforms)
          ? program.platforms.length
          : 1,
      },
    });

    simulateScanJob(scanJob.id, programId, user.id).catch(console.error);

    return NextResponse.json(scanJob, { status: 201 });
  } catch (error) {
    console.error("POST scan error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

async function simulateScanJob(jobId, programId, userId) {
  try {
    const mockProspects = generateMockProspects(10, programId);

    setTimeout(async () => {
      try {
        for (const prospect of mockProspects) {
          await prisma.prospect.upsert({
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
              recentContent: prospect.recentContent,
            },
            create: prospect,
          });
        }

        await prisma.scanJob.update({
          where: { id: jobId },
          data: {
            status: "completed",
            platformsCompleted: Array.isArray(
              (await prisma.program.findUnique({ where: { id: programId } }))
                .platforms
            )
              ? (
                  await prisma.program.findUnique({
                    where: { id: programId },
                  })
                ).platforms.length
              : 1,
            prospectsFound: mockProspects.length,
          },
        });

        await prisma.program.update({
          where: { id: programId },
          data: {
            prospectsCount: {
              increment: mockProspects.length,
            },
          },
        });

        await prisma.notification.create({
          data: {
            userId,
            type: "scan_complete",
            title: "Scan Completed",
            body: `Found ${mockProspects.length} prospects`,
            data: {
              jobId,
              programId,
              prospectsFound: mockProspects.length,
            },
          },
        });
      } catch (err) {
        console.error("Error completing scan job:", err);
        await prisma.scanJob.update({
          where: { id: jobId },
          data: {
            status: "failed",
            errorLog: err.message,
          },
        });
      }
    }, 5000);
  } catch (err) {
    console.error("Error simulating scan:", err);
  }
}

function generateMockProspects(count, programId) {
  const niches = [
    "fashion",
    "tech",
    "fitness",
    "beauty",
    "travel",
    "food",
    "lifestyle",
    "gaming",
  ];
  const platforms = ["instagram", "tiktok", "youtube"];

  const prospects = [];

  for (let i = 0; i < count; i++) {
    const firstName = `Influencer${i + 1}`;
    const handle = `${firstName.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
    const niche = niches[Math.floor(Math.random() * niches.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    prospects.push({
      programId,
      name: firstName,
      handle,
      platform,
      niche,
      followersRaw: Math.floor(Math.random() * 1000000) + 10000,
      engagementRate: Math.random() * 10 + 1,
      verified: Math.random() > 0.7,
      score: Math.floor(Math.random() * 100),
      recentContent: [
        {
          title: `Post about ${niche}`,
          views: Math.floor(Math.random() * 100000),
          date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        },
        {
          title: `Another ${niche} content`,
          views: Math.floor(Math.random() * 100000),
          date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        },
      ],
    });
  }

  return prospects;
}
