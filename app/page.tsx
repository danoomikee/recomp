"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { UploadDialog } from "@/components/upload-dialog"
import { TranscriptCard } from "@/components/transcript-card"
import { TranscriptViewer } from "@/components/transcript-viewer"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getTranscripts } from "@/lib/actions/transcripts"
import type { Transcript } from "@/lib/schemas"

export default function LibraryPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [filteredTranscripts, setFilteredTranscripts] = useState<Transcript[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTranscripts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = transcripts.filter(
        (transcript) =>
          transcript.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transcript.filename.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredTranscripts(filtered)
    } else {
      setFilteredTranscripts(transcripts)
    }
  }, [searchQuery, transcripts])

  const loadTranscripts = async () => {
    setIsLoading(true)
    try {
      const data = await getTranscripts()
      setTranscripts(data)
      setFilteredTranscripts(data)
    } catch (error) {
      console.error("Failed to load transcripts:", error)
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
              <h1 className="text-3xl font-bold font-space-grotesk text-foreground">Subtitle Library</h1>
              <p className="text-muted-foreground mt-2">
                Manage your collection of subtitle transcripts for video recomposition
              </p>
            </div>
            <UploadDialog />
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcripts..."
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
          ) : filteredTranscripts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTranscripts.map((transcript) => (
                <TranscriptCard key={transcript.id} transcript={transcript} onView={setSelectedTranscript} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchQuery ? "No transcripts match your search." : "No transcripts uploaded yet."}
              </div>
              {!searchQuery && (
                <div className="mt-4">
                  <UploadDialog />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <TranscriptViewer
        transcript={selectedTranscript}
        open={!!selectedTranscript}
        onOpenChange={(open) => !open && setSelectedTranscript(null)}
      />
    </div>
  )
}
