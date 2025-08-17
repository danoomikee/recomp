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
import { Upload, FileText } from "lucide-react"
import { parseSubtitleFile } from "@/lib/subtitle-parser"
import { createTranscript } from "@/lib/actions/transcripts"
import { useToast } from "@/hooks/use-toast"

export function UploadDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-populate name from filename
      const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, "")
      setName(nameWithoutExtension)
    }
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) return

    setIsUploading(true)
    try {
      const content = await file.text()
      const segments = parseSubtitleFile(content, file.name)

      const result = await createTranscript({
        name: name.trim(),
        filename: file.name,
        segments,
      })

      if (result.success) {
        toast({
          title: "Transcript uploaded",
          description: `Successfully uploaded "${name}" with ${segments.length} segments.`,
        })
        setOpen(false)
        setFile(null)
        setName("")
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload transcript",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to parse subtitle file. Please check the format.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="h-4 w-4 mr-2" />
          Upload Subtitles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-space-grotesk">Upload Subtitle File</DialogTitle>
          <DialogDescription>Upload an SRT or VTT subtitle file to add to your library.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Subtitle File</Label>
            <Input id="file" type="file" accept=".srt,.vtt" onChange={handleFileChange} className="mt-1" />
          </div>
          {file && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{file.name}</span>
            </div>
          )}
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this transcript"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={!file || !name.trim() || isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
