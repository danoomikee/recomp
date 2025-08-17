import type { Collection, Db } from "mongodb"
import clientPromise from "./mongodb"
import type { Transcript, Project } from "./schemas"

let db: Db
let transcriptsCollection: Collection<Transcript>
let projectsCollection: Collection<Project>

async function connectToDatabase() {
  if (db) {
    return { db, transcriptsCollection, projectsCollection }
  }

  const client = await clientPromise
  db = client.db("reco")

  transcriptsCollection = db.collection<Transcript>("transcripts")
  projectsCollection = db.collection<Project>("projects")

  // Create indexes for better performance
  await transcriptsCollection.createIndex({ id: 1 }, { unique: true })
  await transcriptsCollection.createIndex({ name: 1 })
  await transcriptsCollection.createIndex({ "segments.text": "text" }) // Text search index

  await projectsCollection.createIndex({ id: 1 }, { unique: true })
  await projectsCollection.createIndex({ name: 1 })
  await projectsCollection.createIndex({ updatedAt: -1 })

  return { db, transcriptsCollection, projectsCollection }
}

export { connectToDatabase, transcriptsCollection, projectsCollection }
