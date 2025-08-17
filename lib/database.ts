import { prisma } from "./prisma"

// Database connection utility - now just returns Prisma client
export async function connectToDatabase() {
  return prisma
}

// Helper functions for common database operations
export const db = {
  transcript: prisma.transcript,
  project: prisma.project,
  aggregate: prisma.aggregate,
  subtitleSegment: prisma.subtitleSegment,
}

// Search helper for full-text search across transcript segments
export async function searchTranscriptSegments(query: string, transcriptIds?: string[]) {
  const whereClause = {
    text: {
      contains: query,
      mode: "insensitive" as const,
    },
    ...(transcriptIds &&
      transcriptIds.length > 0 && {
        transcriptId: {
          in: transcriptIds,
        },
      }),
  }

  return await prisma.subtitleSegment.findMany({
    where: whereClause,
    include: {
      transcript: {
        select: {
          id: true,
          name: true,
          filename: true,
        },
      },
    },
    orderBy: [{ transcriptId: "asc" }, { index: "asc" }],
  })
}

export { prisma }
