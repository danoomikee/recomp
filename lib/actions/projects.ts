"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/database"
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/schemas"

export async function createProject(input: CreateProjectInput) {
  try {
    const validatedInput = CreateProjectSchema.parse(input)

    const project = await prisma.project.create({
      data: {
        name: validatedInput.name,
        description: validatedInput.description || "",
      },
      include: {
        transcripts: true,
        aggregates: {
          include: {
            transcript: {
              select: { name: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    revalidatePath("/projects")
    return { success: true, project }
  } catch (error) {
    console.error("Error creating project:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        transcripts: {
          select: { id: true, name: true },
        },
        aggregates: {
          select: { id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return projects
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export async function getProjectById(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        transcripts: {
          include: {
            segments: {
              orderBy: { index: "asc" },
            },
          },
        },
        aggregates: {
          include: {
            transcript: {
              select: { name: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    return project
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  try {
    const validatedInput = UpdateProjectSchema.parse(input)

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedInput.name !== undefined) {
      updateData.name = validatedInput.name
    }
    if (validatedInput.description !== undefined) {
      updateData.description = validatedInput.description
    }
    if (validatedInput.transcriptIds !== undefined) {
      updateData.transcripts = {
        set: validatedInput.transcriptIds.map((id) => ({ id })),
      }
    }

    await prisma.project.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/projects")
    revalidatePath(`/projects/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

export async function deleteProject(id: string) {
  try {
    await prisma.project.delete({
      where: { id },
    })

    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    console.error("Error deleting project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}

export async function addTranscriptToProject(projectId: string, transcriptId: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        transcripts: {
          connect: { id: transcriptId },
        },
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error adding transcript to project:", error)
    return { success: false, error: "Failed to add transcript to project" }
  }
}

export async function removeTranscriptFromProject(projectId: string, transcriptId: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        transcripts: {
          disconnect: { id: transcriptId },
        },
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing transcript from project:", error)
    return { success: false, error: "Failed to remove transcript from project" }
  }
}
