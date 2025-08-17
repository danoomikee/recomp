"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, GripVertical, Copy } from "lucide-react"
import { formatTime } from "@/lib/subtitle-parser"
import { deleteAggregate } from "@/lib/actions/aggregates"
import { useToast } from "@/hooks/use-toast"
import type { Aggregate } from "@/lib/schemas"

interface AggregateBlockProps {
  aggregate: Aggregate
  projectId: string
  transcriptName?: string
  onDelete: (aggregateId: string) => void
  isDragging?: boolean
}

export function AggregateBlock({ aggregate, projectId, transcriptName, onDelete, isDragging }: AggregateBlockProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAggregate(projectId, aggregate.id)
      if (result.success) {
        onDelete(aggregate.id)
        toast({
          title: "Aggregate deleted",
          description: "The aggregate has been removed from your narrative.",
        })
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete aggregate",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(aggregate.text)
    toast({
      title: "Text copied",
      description: "Aggregate text has been copied to clipboard.",
    })
  }

  const segmentCount = aggregate.endSegmentIndex - aggregate.startSegmentIndex + 1

  return (
    <Card
      className={`bg-card hover:shadow-md transition-all cursor-move ${
        isDragging ? "opacity-50 rotate-1 shadow-lg" : "hover:shadow-lg"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex flex-col space-y-1 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {transcriptName || "Unknown"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {segmentCount} segments
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyText}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed line-clamp-3 mb-3 select-text">{aggregate.text}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(aggregate.startTime)}</span>
          <span className="text-muted-foreground/50">→</span>
          <span>{formatTime(aggregate.endTime)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
