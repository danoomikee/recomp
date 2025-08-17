import { z } from "zod"

// Subtitle segment schema - individual lines with timing
export const SubtitleSegmentSchema = z.object({
  id: z.string(),
  startTime: z.number(), // in milliseconds
  endTime: z.number(), // in milliseconds
  text: z.string(),
  index: z.number(), // order in the transcript
})

// Transcript schema - collection of subtitle segments
export const TranscriptSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  name: z.string(),
  filename: z.string(),
  uploadedAt: z.date(),
  segments: z.array(SubtitleSegmentSchema),
  totalDuration: z.number(), // in milliseconds
  segmentCount: z.number(),
})

// Aggregate schema - sequence of consecutive segments from a single transcript
export const AggregateSchema = z.object({
  id: z.string(),
  transcriptId: z.string(),
  startSegmentIndex: z.number(),
  endSegmentIndex: z.number(),
  text: z.string(), // combined text of all segments
  startTime: z.number(),
  endTime: z.number(),
  createdAt: z.date(),
})

// Project schema - workspace for recomposition
export const ProjectSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  transcriptIds: z.array(z.string()), // loaded transcripts
  aggregates: z.array(AggregateSchema), // arranged narrative sequence
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

// Type exports
export type SubtitleSegment = z.infer<typeof SubtitleSegmentSchema>
export type Transcript = z.infer<typeof TranscriptSchema>
export type Aggregate = z.infer<typeof AggregateSchema>
export type Project = z.infer<typeof ProjectSchema>
export type CreateTranscriptInput = z.infer<typeof CreateTranscriptSchema>
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
