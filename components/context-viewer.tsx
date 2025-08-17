"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus } from "lucide-react"
import { formatTime } from "@/lib/subtitle-parser"
import { createAggregate } from "@/lib/actions/aggregates"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import type { SubtitleSegment } from "@/lib/schemas"

interface SearchResult {
  transcriptId: string
  transcriptName: string
  segment: SubtitleSegment
  context: SubtitleSegment[]
}

interface ContextViewerProps {
  result: SearchResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onAggregateCreated: () => void
}

export function ContextViewer({ result, open, onOpenChange, projectId, onAggregateCreated }: ContextViewerProps) {
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  if (!result) return null

  const targetSegmentIndex = result.context.findIndex((seg) => seg.id === result.segment.id)

  const handleSegmentClick = (index: number) => {
    if (!selectedRange) {
      setSelectedRange({ start: index, end: index })
    } else if (selectedRange.start === index && selectedRange.end === index) {
      setSelectedRange(null)
    } else {
      const start = Math.min(selectedRange.start, index)
      const end = Math.max(selectedRange.end, index)
      setSelectedRange({ start, end })
    }
  }

  const expandSelection = (direction: "up" | "down") => {
    if (!selectedRange) return

    if (direction === "up" && selectedRange.start > 0) {
      setSelectedRange({ ...selectedRange, start: selectedRange.start - 1 })
    } else if (direction === "down" && selectedRange.end < result.context.length - 1) {
      setSelectedRange({ ...selectedRange, end: selectedRange.end + 1 })
    }
  }

  const handleCreateAggregate = async () => {
    if (!selectedRange) return

    setIsCreating(true)
    try {
      const selectedSegments = result.context.slice(selectedRange.start, selectedRange.end + 1)
      const aggregateResult = await createAggregate(
        projectId,
        result.transcriptId,
        selectedRange.start,
        selectedRange.end,
        selectedSegments,
      )

      if (aggregateResult.success) {
        toast({
          title: "Aggregate created",
          description: `Created aggregate with ${selectedSegments.length} segments.`,
        })
        setSelectedRange(null)
        onOpenChange(false)
        onAggregateCreated()
      } else {
        toast({
          title: "Creation failed",
          description: aggregateResult.error || "Failed to create aggregate",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">{result.transcriptName}</DialogTitle>
          <DialogDescription>
            Select consecutive segments to create an aggregate. Click segments to select, use expand buttons to adjust.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => expandSelection("up")}
              disabled={!selectedRange || selectedRange.start === 0}
            >
              <Minus className="h-4 w-4 mr-1" />
              Expand Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => expandSelection("down")}
              disabled={!selectedRange || selectedRange.end === result.context.length - 1}
            >
              <Plus className="h-4 w-4 mr-1" />
              Expand Down
            </Button>
          </div>

          {selectedRange && (
            <Button onClick={handleCreateAggregate} disabled={isCreating} className="bg-primary hover:bg-primary/90">
              {isCreating
                ? "Creating..."
                : `Create Aggregate (${selectedRange.end - selectedRange.start + 1} segments)`}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-2">
            {result.context.map((segment, index) => {
              const isTarget = index === targetSegmentIndex
              const isSelected = selectedRange && index >= selectedRange.start && index <= selectedRange.end

              return (
                <div
                  key={segment.id}
                  onClick={() => handleSegmentClick(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : isTarget
                        ? "bg-accent/20 border-accent"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {formatTime(segment.startTime)}
                    </Badge>
                    {isTarget && <Badge className="text-xs bg-accent">Search Match</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed">{segment.text}</p>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
