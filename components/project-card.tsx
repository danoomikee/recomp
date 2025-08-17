"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Play, Trash2, Calendar, FileText } from "lucide-react"
import { deleteProject } from "@/lib/actions/projects"
import { useToast } from "@/hooks/use-toast"
import type { Project } from "@/lib/schemas"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteProject(project.id)
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" has been removed.`,
        })
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete project",
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }

  return (
    <Card className="bg-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-space-grotesk line-clamp-2">{project.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Open Studio
                </Link>
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
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>{project.transcriptIds.length} transcripts</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs">
            {project.aggregates.length} aggregates
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
          <Link href={`/projects/${project.id}`}>
            <Play className="h-4 w-4 mr-2" />
            Open Studio
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
