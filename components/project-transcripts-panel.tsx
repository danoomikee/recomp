"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Clock, X } from "lucide-react"
import { TranscriptSelector } from "./transcript-selector"
import { removeTranscriptFromProject } from "@/lib/actions/projects"
import { useToast } from "@/hooks/use-toast"
import { formatTime } from "@/lib/subtitle-parser"
import type { Project } from "@/lib/schemas"

interface ProjectTranscriptsPanelProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ProjectTranscriptsPanel({ project, onProjectUpdate }: ProjectTranscriptsPanelProps) {
  const { toast } = useToast()

  const transcripts = project.transcripts || []

  const removeTranscript = async (transcriptId: string) => {
    try {
      const result = await removeTranscriptFromProject(project.id, transcriptId)

      if (result.success) {
        const updatedProject = {
          ...project,
          transcripts: transcripts.filter((t) => t.id !== transcriptId),
        }
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
        <p className="text-sm text-muted-foreground">{transcripts.length} transcripts loaded</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {transcripts.length > 0 ? (
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
