"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, Clock, FileText } from "lucide-react"
import { formatTime } from "@/lib/subtitle-parser"
import { deleteTranscript } from "@/lib/actions/transcripts"
import { useToast } from "@/hooks/use-toast"
import type { Transcript } from "@/lib/schemas"

interface TranscriptCardProps {
  transcript: Transcript
  onView?: (transcript: Transcript) => void
}

export function TranscriptCard({ transcript, onView }: TranscriptCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteTranscript(transcript.id)
      if (result.success) {
        toast({
          title: "Transcript deleted",
          description: `"${transcript.name}" has been removed from your library.`,
        })
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete transcript",
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

  return (
    <Card className="bg-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-space-grotesk line-clamp-2">{transcript.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(transcript)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
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
      <CardContent className="pb-3">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>{transcript.segmentCount} segments</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(transcript.totalDuration)}</span>
          </div>
        </div>
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs">
            {transcript.filename}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" onClick={() => onView?.(transcript)} className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          View Transcript
        </Button>
      </CardFooter>
    </Card>
  )
}
