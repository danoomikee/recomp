"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, FileText, Clock } from "lucide-react"
import { getTranscripts } from "@/lib/actions/transcripts"
import { updateProject } from "@/lib/actions/projects"
import { useToast } from "@/hooks/use-toast"
import { formatTime } from "@/lib/subtitle-parser"
import type { Transcript, Project } from "@/lib/schemas"

interface TranscriptSelectorProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function TranscriptSelector({ project, onProjectUpdate }: TranscriptSelectorProps) {
  const [open, setOpen] = useState(false)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(project.transcriptIds)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadTranscripts()
    }
  }, [open])

  const loadTranscripts = async () => {
    setIsLoading(true)
    try {
      const data = await getTranscripts()
      setTranscripts(data)
    } catch (error) {
      console.error("Failed to load transcripts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateProject(project.id, {
        transcriptIds: selectedIds,
      })

      if (result.success) {
        const updatedProject = { ...project, transcriptIds: selectedIds }
        onProjectUpdate(updatedProject)
        toast({
          title: "Transcripts updated",
          description: `${selectedIds.length} transcripts loaded into project.`,
        })
        setOpen(false)
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTranscript = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Transcripts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Select Transcripts</DialogTitle>
          <DialogDescription>Choose transcripts to load into your project for recomposition.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map((transcript) => (
                <div
                  key={transcript.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.includes(transcript.id)}
                    onCheckedChange={() => toggleTranscript(transcript.id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{transcript.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{transcript.segmentCount} segments</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(transcript.totalDuration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">{selectedIds.length} transcripts selected</div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? "Saving..." : "Save Selection"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
