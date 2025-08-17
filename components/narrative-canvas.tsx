"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { AggregateBlock } from "./aggregate-block"
import { FileText, Download, Play } from "lucide-react"
import { reorderAggregates } from "@/lib/actions/aggregates"
import { getTranscriptById } from "@/lib/actions/transcripts"
import { useToast } from "@/hooks/use-toast"
import type { Project } from "@/lib/schemas"

interface NarrativeCanvasProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function NarrativeCanvas({ project, onProjectUpdate }: NarrativeCanvasProps) {
  const [transcriptMap, setTranscriptMap] = useState<Record<string, string>>({})
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTranscriptNames()
  }, [project.transcriptIds])

  const loadTranscriptNames = async () => {
    const map: Record<string, string> = {}
    for (const id of project.transcriptIds) {
      try {
        const transcript = await getTranscriptById(id)
        if (transcript) {
          map[id] = transcript.name
        }
      } catch (error) {
        console.error("Failed to load transcript:", error)
      }
    }
    setTranscriptMap(map)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))

    if (dragIndex !== dropIndex && dragIndex !== null) {
      await reorderItems(dragIndex, dropIndex)
    }

    resetDragState()
  }

  const handleDragEnd = () => {
    resetDragState()
  }

  const resetDragState = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsDragging(false)
  }

  const reorderItems = async (fromIndex: number, toIndex: number) => {
    const newAggregates = [...project.aggregates]
    const [draggedItem] = newAggregates.splice(fromIndex, 1)
    newAggregates.splice(toIndex, 0, draggedItem)

    try {
      const result = await reorderAggregates(project.id, newAggregates)
      if (result.success) {
        onProjectUpdate({ ...project, aggregates: newAggregates })
        toast({
          title: "Narrative reordered",
          description: "Your narrative sequence has been updated.",
        })
      }
    } catch (error) {
      toast({
        title: "Reorder failed",
        description: "Failed to reorder aggregates",
        variant: "destructive",
      })
    }
  }

  const handleAggregateDelete = (aggregateId: string) => {
    const updatedAggregates = project.aggregates.filter((a) => a.id !== aggregateId)
    onProjectUpdate({ ...project, aggregates: updatedAggregates })
  }

  const exportNarrative = () => {
    const narrative = project.aggregates
      .map((aggregate, index) => {
        const transcriptName = transcriptMap[aggregate.transcriptId] || "Unknown"
        return `${index + 1}. [${transcriptName}] ${aggregate.text}`
      })
      .join("\n\n")

    const blob = new Blob([narrative], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_narrative.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Narrative exported",
      description: "Your narrative has been downloaded as a text file.",
    })
  }

  const previewNarrative = () => {
    const narrative = project.aggregates.map((aggregate) => aggregate.text).join(" ")

    // Create a simple preview modal content
    const previewWindow = window.open("", "_blank", "width=800,height=600")
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>${project.name} - Narrative Preview</title>
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
              h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 0.5rem; }
              .narrative { background: #f1f5f9; padding: 1.5rem; border-radius: 0.5rem; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${project.name}</h1>
            <div class="narrative">${narrative}</div>
          </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold font-space-grotesk">Narrative Canvas</h2>
            <p className="text-sm text-muted-foreground">Drag and drop aggregates to arrange your new narrative</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground mr-4">{project.aggregates.length} aggregates</div>
            {project.aggregates.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={previewNarrative}>
                  <Play className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button size="sm" onClick={exportNarrative} className="bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {project.aggregates.length > 0 ? (
            <div className="space-y-4">
              {project.aggregates.map((aggregate, index) => (
                <div
                  key={aggregate.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative transition-all duration-200 ${
                    dragOverIndex === index && draggedIndex !== index ? "transform translate-y-2" : ""
                  }`}
                >
                  {dragOverIndex === index && draggedIndex !== index && (
                    <div className="absolute -top-2 left-0 right-0 h-1 bg-primary rounded-full opacity-75 z-10" />
                  )}

                  <div
                    className={`${isDragging && draggedIndex === index ? "opacity-50 scale-95" : ""} transition-all duration-200`}
                  >
                    <AggregateBlock
                      aggregate={aggregate}
                      projectId={project.id}
                      transcriptName={transcriptMap[aggregate.transcriptId]}
                      onDelete={handleAggregateDelete}
                      isDragging={draggedIndex === index}
                    />
                  </div>
                </div>
              ))}

              {isDragging && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverIndex(project.aggregates.length)
                  }}
                  onDrop={(e) => handleDrop(e, project.aggregates.length)}
                  className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                    dragOverIndex === project.aggregates.length
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/30"
                  }`}
                >
                  <span className="text-sm text-muted-foreground">Drop here to add at end</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No aggregates yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Use the search panel to find dialogue and create aggregates. They'll appear here as building blocks for
                your narrative.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <span>Search for dialogue</span>
                <span>→</span>
                <span>View context</span>
                <span>→</span>
                <span>Create aggregate</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
