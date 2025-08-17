"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ProjectTranscriptsPanel } from "@/components/project-transcripts-panel"
import { SearchPanel } from "@/components/search-panel"
import { NarrativeCanvas } from "@/components/narrative-canvas"
import { ContextViewer } from "@/components/context-viewer"
import { ExportDialog } from "@/components/export-dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Download } from "lucide-react"
import Link from "next/link"
import { getProjectById } from "@/lib/actions/projects"
import { getTranscriptById } from "@/lib/actions/transcripts"
import type { Project, SubtitleSegment } from "@/lib/schemas"

interface SearchResult {
  transcriptId: string
  transcriptName: string
  segment: SubtitleSegment
  context: SubtitleSegment[]
}

export default function ProjectStudioPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [transcriptMap, setTranscriptMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [contextResult, setContextResult] = useState<SearchResult | null>(null)
  const [contextViewerOpen, setContextViewerOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadProject(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (project) {
      loadTranscriptNames()
    }
  }, [project]) // Updated to use the entire project object as dependency

  const loadProject = async (id: string) => {
    setIsLoading(true)
    try {
      const data = await getProjectById(id)
      setProject(data)
    } catch (error) {
      console.error("Failed to load project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTranscriptNames = async () => {
    if (!project) return

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

  const handleViewContext = (result: SearchResult) => {
    setContextResult(result)
    setContextViewerOpen(true)
  }

  const handleAggregateCreated = () => {
    // Reload project to get updated aggregates
    if (params.id) {
      loadProject(params.id as string)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
              <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
              <Link href="/projects">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold font-space-grotesk text-foreground">{project.name}</h1>
              {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {project.aggregates.length > 0 && (
              <ExportDialog
                project={project}
                transcriptMap={transcriptMap}
                trigger={
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                }
              />
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Project Transcripts */}
          <div className="w-80 border-r bg-sidebar">
            <ProjectTranscriptsPanel project={project} onProjectUpdate={setProject} />
          </div>

          {/* Center Panel - Narrative Canvas */}
          <div className="flex-1 bg-background">
            <NarrativeCanvas project={project} onProjectUpdate={setProject} />
          </div>

          {/* Right Panel - Search & Discovery */}
          <div className="w-80 border-l bg-sidebar">
            <SearchPanel
              transcriptIds={project.transcriptIds}
              projectId={project.id}
              onViewContext={handleViewContext}
              onAggregateCreated={handleAggregateCreated}
            />
          </div>
        </div>
      </main>

      <ContextViewer
        result={contextResult}
        open={contextViewerOpen}
        onOpenChange={setContextViewerOpen}
        projectId={project.id}
        onAggregateCreated={handleAggregateCreated}
      />
    </div>
  )
}
