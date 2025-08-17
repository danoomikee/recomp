"use server"

import { revalidatePath } from "next/cache"
import { connectToDatabase } from "@/lib/database"
import { CreateTranscriptSchema, type Transcript, type CreateTranscriptInput } from "@/lib/schemas"
import { nanoid } from "nanoid"

export async function createTranscript(input: CreateTranscriptInput) {
  try {
    const validatedInput = CreateTranscriptSchema.parse(input)
    const { transcriptsCollection } = await connectToDatabase()

    const transcript: Transcript = {
      id: nanoid(),
      name: validatedInput.name,
      filename: validatedInput.filename,
      uploadedAt: new Date(),
      segments: validatedInput.segments,
      totalDuration: Math.max(...validatedInput.segments.map((s) => s.endTime)),
      segmentCount: validatedInput.segments.length,
    }

    const result = await transcriptsCollection.insertOne(transcript)

    if (!result.insertedId) {
      throw new Error("Failed to create transcript")
    }

    revalidatePath("/library")
    return { success: true, transcript }
  } catch (error) {
    console.error("Error creating transcript:", error)
    return { success: false, error: "Failed to create transcript" }
  }
}

export async function getTranscripts() {
  try {
    const { transcriptsCollection } = await connectToDatabase()
    const transcripts = await transcriptsCollection.find({}).sort({ uploadedAt: -1 }).toArray()

    return transcripts.map((transcript) => ({
      ...transcript,
      _id: transcript._id?.toString(),
    }))
  } catch (error) {
    console.error("Error fetching transcripts:", error)
    return []
  }
}

export async function getTranscriptById(id: string) {
  try {
    const { transcriptsCollection } = await connectToDatabase()
    const transcript = await transcriptsCollection.findOne({ id })

    if (!transcript) {
      return null
    }

    return {
      ...transcript,
      _id: transcript._id?.toString(),
    }
  } catch (error) {
    console.error("Error fetching transcript:", error)
    return null
  }
}

export async function deleteTranscript(id: string) {
  try {
    const { transcriptsCollection } = await connectToDatabase()
    const result = await transcriptsCollection.deleteOne({ id })

    if (result.deletedCount === 0) {
      throw new Error("Transcript not found")
    }

    revalidatePath("/library")
    return { success: true }
  } catch (error) {
    console.error("Error deleting transcript:", error)
    return { success: false, error: "Failed to delete transcript" }
  }
}

export async function searchTranscripts(query: string, transcriptIds?: string[]) {
  try {
    const { transcriptsCollection } = await connectToDatabase()

    const filter: any = {
      $text: { $search: query },
    }

    if (transcriptIds && transcriptIds.length > 0) {
      filter.id = { $in: transcriptIds }
    }

    const transcripts = await transcriptsCollection
      .find(filter, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .toArray()

    // Find matching segments within each transcript
    const results = transcripts.flatMap((transcript) => {
      const matchingSegments = transcript.segments.filter((segment) =>
        segment.text.toLowerCase().includes(query.toLowerCase()),
      )

      return matchingSegments.map((segment) => ({
        transcriptId: transcript.id,
        transcriptName: transcript.name,
        segment,
        context: transcript.segments.slice(
          Math.max(0, segment.index - 2),
          Math.min(transcript.segments.length, segment.index + 3),
        ),
      }))
    })

    return results
  } catch (error) {
    console.error("Error searching transcripts:", error)
    return []
  }
}
