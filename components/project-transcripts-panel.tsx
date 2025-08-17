"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Clock, X } from "lucide-react"
import { TranscriptSelector } from "./transcript-selector"
import { getTranscriptById } from "@/lib/actions/transcripts"
import { updateProject } from "@/lib/actions/projects"
import { useToast } from "@/hooks/use-toast"
import { formatTime } from "@/lib/subtitle-parser"
import type { Transcript, Project } from "@/lib/schemas"

interface ProjectTranscriptsPanelProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ProjectTranscriptsPanel({ project, onProjectUpdate }: ProjectTranscriptsPanelProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTranscripts()
  }, [project.transcriptIds])

  const loadTranscripts = async () => {
    if (project.transcriptIds.length === 0) {
      setTranscripts([])
      return
    }

    setIsLoading(true)
    try {
      const transcriptPromises = project.transcriptIds.map((id) => getTranscriptById(id))
      const results = await Promise.all(transcriptPromises)
      const validTranscripts = results.filter((t): t is Transcript => t !== null)
      setTranscripts(validTranscripts)
    } catch (error) {
      console.error("Failed to load transcripts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeTranscript = async (transcriptId: string) => {
    try {
      const updatedIds = project.transcriptIds.filter((id) => id !== transcriptId)
      const result = await updateProject(project.id, {
        transcriptIds: updatedIds,
      })

      if (result.success) {
        const updatedProject = { ...project, transcriptIds: updatedIds }
        onProjectUpdate(updatedProject)
        toast({
          title: "Transcript removed",
          description: "Transcript has been removed from the project.",
        })
      }
    } catch (error) {
      toast({
        title: "Remove failed",
        description: "Failed to remove transcript",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold font-space-grotesk">Project Transcripts</h3>
          <TranscriptSelector project={project} onProjectUpdate={onProjectUpdate} />
        </div>
        <p className="text-sm text-muted-foreground">{project.transcriptIds.length} transcripts loaded</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : transcripts.length > 0 ? (
            <div className="space-y-3">
              {transcripts.map((transcript) => (
                <div key={transcript.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-2">{transcript.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTranscript(transcript.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{transcript.segmentCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(transcript.totalDuration)}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs mt-2">
                    {transcript.filename}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No transcripts loaded</p>
              <p className="text-xs mt-1">Add transcripts to start searching</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
