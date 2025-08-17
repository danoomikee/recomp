"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/database"
import type { SubtitleSegment } from "@/lib/schemas"

export async function createAggregate(
  projectId: string,
  transcriptId: string,
  startSegmentIndex: number,
  endSegmentIndex: number,
  segments: SubtitleSegment[],
) {
  try {
    const aggregate = await prisma.aggregate.create({
      data: {
        transcriptId,
        projectId,
        startSegmentIndex,
        endSegmentIndex,
        text: segments.map((s) => s.text).join(" "),
        startTime: segments[0].startTime,
        endTime: segments[segments.length - 1].endTime,
        order: await getNextAggregateOrder(projectId),
      },
      include: {
        transcript: {
          select: { name: true },
        },
      },
    })

    // Update project's updatedAt timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true, aggregate }
  } catch (error) {
    console.error("Error creating aggregate:", error)
    return { success: false, error: "Failed to create aggregate" }
  }
}

export async function deleteAggregate(projectId: string, aggregateId: string) {
  try {
    await prisma.aggregate.delete({
      where: { id: aggregateId },
    })

    // Update project's updatedAt timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting aggregate:", error)
    return { success: false, error: "Failed to delete aggregate" }
  }
}

export async function reorderAggregates(projectId: string, aggregateIds: string[]) {
  try {
    await prisma.$transaction(
      aggregateIds.map((id, index) =>
        prisma.aggregate.update({
          where: { id },
          data: { order: index },
        }),
      ),
    )

    // Update project's updatedAt timestamp
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error reordering aggregates:", error)
    return { success: false, error: "Failed to reorder aggregates" }
  }
}

// Helper function to get the next order value for aggregates
async function getNextAggregateOrder(projectId: string): Promise<number> {
  const lastAggregate = await prisma.aggregate.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  })

  return (lastAggregate?.order ?? -1) + 1
}
