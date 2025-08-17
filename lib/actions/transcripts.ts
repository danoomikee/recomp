"use server"

import { revalidatePath } from "next/cache"
import { prisma, searchTranscriptSegments } from "@/lib/database"
import { CreateTranscriptSchema, type CreateTranscriptInput } from "@/lib/schemas"

export async function createTranscript(input: CreateTranscriptInput) {
  try {
    const validatedInput = CreateTranscriptSchema.parse(input)

    const transcript = await prisma.transcript.create({
      data: {
        name: validatedInput.name,
        filename: validatedInput.filename,
        totalDuration: Math.max(...validatedInput.segments.map((s) => s.endTime)),
        segmentCount: validatedInput.segments.length,
        segments: {
          create: validatedInput.segments.map((segment) => ({
            startTime: segment.startTime,
            endTime: segment.endTime,
            text: segment.text,
            index: segment.index,
          })),
        },
      },
      include: {
        segments: true,
      },
    })

    revalidatePath("/library")
    return { success: true, transcript }
  } catch (error) {
    console.error("Error creating transcript:", error)
    return { success: false, error: "Failed to create transcript" }
  }
}

export async function getTranscripts() {
  try {
    const transcripts = await prisma.transcript.findMany({
      include: {
        segments: {
          orderBy: { index: "asc" },
        },
      },
      orderBy: { uploadedAt: "desc" },
    })

    return transcripts
  } catch (error) {
    console.error("Error fetching transcripts:", error)
    return []
  }
}

export async function getTranscriptById(id: string) {
  try {
    const transcript = await prisma.transcript.findUnique({
      where: { id },
      include: {
        segments: {
          orderBy: { index: "asc" },
        },
      },
    })

    return transcript
  } catch (error) {
    console.error("Error fetching transcript:", error)
    return null
  }
}

export async function deleteTranscript(id: string) {
  try {
    await prisma.transcript.delete({
      where: { id },
    })

    revalidatePath("/library")
    return { success: true }
  } catch (error) {
    console.error("Error deleting transcript:", error)
    return { success: false, error: "Failed to delete transcript" }
  }
}

export async function searchTranscripts(query: string, transcriptIds?: string[]) {
  try {
    const segments = await searchTranscriptSegments(query, transcriptIds)

    // Build results with context
    const results = await Promise.all(
      segments.map(async (segment) => {
        // Get context segments around the match
        const contextSegments = await prisma.subtitleSegment.findMany({
          where: {
            transcriptId: segment.transcriptId,
            index: {
              gte: Math.max(0, segment.index - 2),
              lte: segment.index + 2,
            },
          },
          orderBy: { index: "asc" },
        })

        return {
          transcriptId: segment.transcriptId,
          transcriptName: segment.transcript.name,
          segment: {
            id: segment.id,
            startTime: segment.startTime,
            endTime: segment.endTime,
            text: segment.text,
            index: segment.index,
          },
          context: contextSegments.map((s) => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            text: s.text,
            index: s.index,
          })),
        }
      }),
    )

    return results
  } catch (error) {
    console.error("Error searching transcripts:", error)
    return []
  }
}
