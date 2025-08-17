"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Eye, Plus } from "lucide-react"
import { searchTranscripts } from "@/lib/actions/transcripts"
import { createAggregate } from "@/lib/actions/aggregates"
import { formatTime } from "@/lib/subtitle-parser"
import { useToast } from "@/hooks/use-toast"
import type { SubtitleSegment } from "@/lib/schemas"

interface SearchResult {
  transcriptId: string
  transcriptName: string
  segment: SubtitleSegment
  context: SubtitleSegment[]
}

interface SearchPanelProps {
  transcriptIds: string[]
  projectId: string
  onViewContext: (result: SearchResult) => void
  onAggregateCreated: () => void
}

export function SearchPanel({ transcriptIds, projectId, onViewContext, onAggregateCreated }: SearchPanelProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [creatingAggregates, setCreatingAggregates] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    if (query.trim() && transcriptIds.length > 0) {
      const timeoutId = setTimeout(() => {
        performSearch(query.trim())
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setResults([])
    }
  }, [query, transcriptIds])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const searchResults = await searchTranscripts(searchQuery, transcriptIds)
      setResults(searchResults)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleQuickCreateAggregate = async (result: SearchResult) => {
    const aggregateKey = `${result.transcriptId}-${result.segment.id}`
    setCreatingAggregates((prev) => new Set(prev).add(aggregateKey))

    try {
      const aggregateResult = await createAggregate(
        projectId,
        result.transcriptId,
        result.segment.index,
        result.segment.index,
        [result.segment],
      )

      if (aggregateResult.success) {
        toast({
          title: "Aggregate created",
          description: "Single segment aggregate added to your narrative.",
        })
        onAggregateCreated()
      } else {
        toast({
          title: "Creation failed",
          description: aggregateResult.error || "Failed to create aggregate",
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
      setCreatingAggregates((prev) => {
        const newSet = new Set(prev)
        newSet.delete(aggregateKey)
        return newSet
      })
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold font-space-grotesk mb-3">Search & Discovery</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dialogue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {transcriptIds.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">Load transcripts to start searching</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {isSearching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, index) => {
                const aggregateKey = `${result.transcriptId}-${result.segment.id}`
                const isCreating = creatingAggregates.has(aggregateKey)

                return (
                  <div
                    key={`${result.transcriptId}-${result.segment.id}`}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {result.transcriptName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatTime(result.segment.startTime)}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed mb-3">{result.segment.text}</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => onViewContext(result)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Context
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleQuickCreateAggregate(result)}
                        disabled={isCreating}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {isCreating ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : query.trim() && transcriptIds.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
