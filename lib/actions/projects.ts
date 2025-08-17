"use server"

import { revalidatePath } from "next/cache"
import { connectToDatabase } from "@/lib/database"
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  type Project,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/schemas"
import { nanoid } from "nanoid"

export async function createProject(input: CreateProjectInput) {
  try {
    const validatedInput = CreateProjectSchema.parse(input)
    const { projectsCollection } = await connectToDatabase()

    const project: Project = {
      id: nanoid(),
      name: validatedInput.name,
      description: validatedInput.description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      transcriptIds: [],
      aggregates: [],
    }

    const result = await projectsCollection.insertOne(project)

    if (!result.insertedId) {
      throw new Error("Failed to create project")
    }

    revalidatePath("/projects")
    return { success: true, project }
  } catch (error) {
    console.error("Error creating project:", error)
    return { success: false, error: "Failed to create project" }
  }
}

export async function getProjects() {
  try {
    const { projectsCollection } = await connectToDatabase()
    const projects = await projectsCollection.find({}).sort({ updatedAt: -1 }).toArray()

    return projects.map((project) => ({
      ...project,
      _id: project._id?.toString(),
    }))
  } catch (error) {
    console.error("Error fetching projects:", error)
    return []
  }
}

export async function getProjectById(id: string) {
  try {
    const { projectsCollection } = await connectToDatabase()
    const project = await projectsCollection.findOne({ id })

    if (!project) {
      return null
    }

    return {
      ...project,
      _id: project._id?.toString(),
    }
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  try {
    const validatedInput = UpdateProjectSchema.parse(input)
    const { projectsCollection } = await connectToDatabase()

    const updateData = {
      ...validatedInput,
      updatedAt: new Date(),
    }

    const result = await projectsCollection.updateOne({ id }, { $set: updateData })

    if (result.matchedCount === 0) {
      throw new Error("Project not found")
    }

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
    const { projectsCollection } = await connectToDatabase()
    const result = await projectsCollection.deleteOne({ id })

    if (result.deletedCount === 0) {
      throw new Error("Project not found")
    }

    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    console.error("Error deleting project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}
