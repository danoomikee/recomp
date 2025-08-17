"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProject } from "@/lib/actions/projects"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CreateProjectDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function CreateProjectDialog({ open, onOpenChange, trigger }: CreateProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const result = await createProject({
        name: name.trim(),
        description: description.trim(),
      })

      if (result.success && result.project) {
        toast({
          title: "Project created",
          description: `"${name}" has been created successfully.`,
        })
        setIsOpen(false)
        setName("")
        setDescription("")
        // Navigate to the new project
        router.push(`/projects/${result.project.id}`)
      } else {
        toast({
          title: "Creation failed",
          description: result.error || "Failed to create project",
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Create New Project</DialogTitle>
          <DialogDescription>
            Start a new recomposition project to build narratives from your subtitle library.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="project-description">Description (Optional)</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="bg-primary hover:bg-primary/90"
          >
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
