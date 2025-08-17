import { z } from "zod"
import type {
  Transcript as PrismaTranscript,
  Project as PrismaProject,
  Aggregate as PrismaAggregate,
  SubtitleSegment as PrismaSubtitleSegment,
} from "@prisma/client"

// Subtitle segment schema - individual lines with timing
export const SubtitleSegmentSchema = z.object({
  id: z.string(),
  startTime: z.number(), // in milliseconds
  endTime: z.number(), // in milliseconds
  text: z.string(),
  index: z.number(), // order in the transcript
})

export const TranscriptSchema = z.object({
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  uploadedAt: z.date(),
  segments: z.array(SubtitleSegmentSchema),
  totalDuration: z.number(), // in milliseconds
  segmentCount: z.number(),
})

export const AggregateSchema = z.object({
  id: z.string(),
  transcriptId: z.string(),
  startSegmentIndex: z.number(),
  endSegmentIndex: z.number(),
  text: z.string(), // combined text of all segments
  startTime: z.number(),
  endTime: z.number(),
  createdAt: z.date(),
  order: z.number().optional(),
})

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  transcriptIds: z.array(z.string()).optional(),
  aggregates: z.array(AggregateSchema).optional(),
})

// Form schemas for validation
export const CreateTranscriptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  filename: z.string().min(1, "Filename is required"),
  segments: z.array(SubtitleSegmentSchema),
})

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
  description: z.string().optional(),
  transcriptIds: z.array(z.string()).optional(),
  aggregates: z.array(AggregateSchema).optional(),
})

export type SubtitleSegment = PrismaSubtitleSegment
export type Transcript = PrismaTranscript & {
  segments: SubtitleSegment[]
}
export type Aggregate = PrismaAggregate & {
  transcript?: { name: string }
}
export type Project = PrismaProject & {
  transcripts?: Transcript[]
  aggregates?: Aggregate[]
}

// Keep form input types using Zod inference
export type CreateTranscriptInput = z.infer<typeof CreateTranscriptSchema>
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
