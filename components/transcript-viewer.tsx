"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatTime } from "@/lib/subtitle-parser"
import type { Transcript } from "@/lib/schemas"

interface TranscriptViewerProps {
  transcript: Transcript | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TranscriptViewer({ transcript, open, onOpenChange }: TranscriptViewerProps) {
  if (!transcript) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">{transcript.name}</DialogTitle>
          <DialogDescription>
            {transcript.segmentCount} segments • {formatTime(transcript.totalDuration)} total duration
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-3">
            {transcript.segments.map((segment) => (
              <div
                key={segment.id}
                className="flex space-x-4 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex-shrink-0 w-24">
                  <Badge variant="outline" className="text-xs">
                    {formatTime(segment.startTime)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{segment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
