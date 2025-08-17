import type { SubtitleSegment } from "./schemas"
import { nanoid } from "nanoid"

// Parse SRT format
function parseSRT(content: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = []
  const blocks = content.trim().split(/\n\s*\n/)

  blocks.forEach((block, index) => {
    const lines = block.trim().split("\n")
    if (lines.length < 3) return

    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/)
    if (!timeMatch) return

    const startTime = timeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
    const endTime = timeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8])
    const text = lines
      .slice(2)
      .join(" ")
      .replace(/<[^>]*>/g, "") // Remove HTML tags

    segments.push({
      id: nanoid(),
      startTime,
      endTime,
      text,
      index,
    })
  })

  return segments
}

// Parse VTT format
function parseVTT(content: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = []
  const lines = content.split("\n")
  let index = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip WEBVTT header and empty lines
    if (line === "WEBVTT" || line === "" || line.startsWith("NOTE")) continue

    // Look for timestamp line
    const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/)
    if (timeMatch) {
      const startTime = timeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4])
      const endTime = timeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8])

      // Collect text lines until next timestamp or end
      const textLines = []
      i++
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].includes("-->")) {
        textLines.push(lines[i].trim())
        i++
      }
      i-- // Back up one since the loop will increment

      const text = textLines.join(" ").replace(/<[^>]*>/g, "") // Remove HTML tags

      segments.push({
        id: nanoid(),
        startTime,
        endTime,
        text,
        index,
      })
      index++
    }
  }

  return segments
}

function timeToMs(hours: string, minutes: string, seconds: string, milliseconds: string): number {
  return (
    Number.parseInt(hours) * 3600000 +
    Number.parseInt(minutes) * 60000 +
    Number.parseInt(seconds) * 1000 +
    Number.parseInt(milliseconds)
  )
}

export function parseSubtitleFile(content: string, filename: string): SubtitleSegment[] {
  const extension = filename.split(".").pop()?.toLowerCase()

  switch (extension) {
    case "srt":
      return parseSRT(content)
    case "vtt":
      return parseVTT(content)
    default:
      throw new Error(`Unsupported subtitle format: ${extension}`)
  }
}

export function formatTime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3600000)
  const minutes = Math.floor((milliseconds % 3600000) / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  const ms = milliseconds % 1000

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}
