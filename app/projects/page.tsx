"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { ProjectCard } from "@/components/project-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { getProjects } from "@/lib/actions/projects"
import type { Project } from "@/lib/schemas"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    loadProjects()
    // Check if we should open the create dialog
    if (searchParams.get("new") === "true") {
      setCreateDialogOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredProjects(filtered)
    } else {
      setFilteredProjects(projects)
    }
  }, [searchQuery, projects])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await getProjects()
      setProjects(data)
      setFilteredProjects(data)
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-space-grotesk text-foreground">Projects</h1>
              <p className="text-muted-foreground mt-2">Manage your recomposition projects and create new narratives</p>
            </div>
            <CreateProjectDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              trigger={
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              }
            />
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchQuery ? "No projects match your search." : "No projects created yet."}
              </div>
              {!searchQuery && (
                <div className="mt-4">
                  <CreateProjectDialog
                    trigger={
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Project
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
