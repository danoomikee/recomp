"use server"

import { revalidatePath } from "next/cache"
import { connectToDatabase } from "@/lib/database"
import type { Aggregate, SubtitleSegment } from "@/lib/schemas"
import { nanoid } from "nanoid"

export async function createAggregate(
  projectId: string,
  transcriptId: string,
  startSegmentIndex: number,
  endSegmentIndex: number,
  segments: SubtitleSegment[],
) {
  try {
    const { projectsCollection } = await connectToDatabase()

    const aggregate: Aggregate = {
      id: nanoid(),
      transcriptId,
      startSegmentIndex,
      endSegmentIndex,
      text: segments.map((s) => s.text).join(" "),
      startTime: segments[0].startTime,
      endTime: segments[segments.length - 1].endTime,
      createdAt: new Date(),
    }

    const result = await projectsCollection.updateOne(
      { id: projectId },
      {
        $push: { aggregates: aggregate },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      throw new Error("Project not found")
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, aggregate }
  } catch (error) {
    console.error("Error creating aggregate:", error)
    return { success: false, error: "Failed to create aggregate" }
  }
}

export async function deleteAggregate(projectId: string, aggregateId: string) {
  try {
    const { projectsCollection } = await connectToDatabase()

    const result = await projectsCollection.updateOne(
      { id: projectId },
      {
        $pull: { aggregates: { id: aggregateId } },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      throw new Error("Project not found")
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting aggregate:", error)
    return { success: false, error: "Failed to delete aggregate" }
  }
}

export async function reorderAggregates(projectId: string, aggregates: Aggregate[]) {
  try {
    const { projectsCollection } = await connectToDatabase()

    const result = await projectsCollection.updateOne(
      { id: projectId },
      {
        $set: {
          aggregates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new Error("Project not found")
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error reordering aggregates:", error)
    return { success: false, error: "Failed to reorder aggregates" }
  }
}
